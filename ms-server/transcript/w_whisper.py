from typing import Optional, List, Dict, Any, Tuple, Union

import whisper
import torch
import gc
import numpy as np
from numpy.typing import NDArray
import asyncio
import concurrent.futures

from transcript.worker import TranscriptionResult, Worker

_executor = concurrent.futures.ThreadPoolExecutor()
_run_async = lambda f, *a: asyncio.get_event_loop().run_in_executor(_executor, f, *a)

ONE_MS_SAMPLE = 16
SAMPLE_RATE = ONE_MS_SAMPLE * 1000  # 1s
MAX_SAMPLE_COUNT = SAMPLE_RATE * 20  # 20s
GAP_FILL_MAX = 2000  # ms


def convert_segment(s: Dict[str, Any], complete: bool, start_time: int, lang: str = ''):
  return TranscriptionResult(
      partial=not complete,
      start=int(s['start'] * 1000) + start_time,
      end=int(s['end'] * 1000) + start_time,
      text=s['text'],
      lang=lang
  )


async def transcribe_and_segment(
    model: whisper.Whisper,
    data: NDArray,  # float type with -1 to 1
    start_time: int = 0,
    force_complete: bool = False,
    t_fc_gap: float = 1,
    t_fc_length: float = 10,
):
  # run transcription asynchrously
  duration = data.size / SAMPLE_RATE  # seconds
  raw_result: List[Dict[str, Any]] = await _run_async(
      lambda: model.transcribe(
          data,
          fp16=torch.cuda.is_available(),
      ))
  segments = raw_result['segments']
  lang = raw_result['language']

  # handle incomplete segment
  incomplete_segment = None if force_complete or len(
      segments) == 0 else segments[-1]
  # check thresholds
  if not incomplete_segment:
    pass
  elif duration - incomplete_segment['end'] >= t_fc_gap:
    incomplete_segment = None
  elif incomplete_segment['end'] - incomplete_segment['start'] > t_fc_length:
    incomplete_segment = None

  complete_segments = segments if incomplete_segment is None else segments[:-1]

  last_timestamp: float = duration if (not complete_segments and not incomplete_segment) else \
      (complete_segments[-1]['end']
       if complete_segments else incomplete_segment['start'])
  sample_retain = max(min(data.size, int(last_timestamp * SAMPLE_RATE)), 0)

  # handle complete segments
  results = [convert_segment(s, True, start_time, lang)
             for s in complete_segments]

  incomplete_result = convert_segment(incomplete_segment, False, start_time, lang) \
      if incomplete_segment else None

  return results, incomplete_result, sample_retain


class WhisperWorker(Worker):

  def __init__(
          self,
          model: str):

    self.model: Optional[whisper.Whisper] = None
    self.init_params: str = model
    self.queue = asyncio.Queue(maxsize=65536)
    self.lock = asyncio.Lock()

    self.last_element: Optional[Tuple[int, NDArray[np.float32]]] = None

  async def init_model(self):
    self.model = await _run_async(lambda: whisper.load_model(self.init_params))

  def close_model_sync(self):
    del self.model
    if torch.cuda.is_available():
      torch.cuda.empty_cache()
    gc.collect()
    self.model = None

  async def close_model(self):
    await _run_async(self.close_model_sync)

  async def enqueue_chunk(self, time: int, sample: NDArray[np.float32]):
    # pad zero
    remainder = sample.size % 16
    if remainder != 0:
      num_zeros_to_add = 16 - remainder
      zeros_to_add = np.zeros(num_zeros_to_add, dtype=sample.dtype)
      sample = np.concatenate((sample, zeros_to_add))  
    
    async with self.lock:
      await self.queue.put((time, sample))

  async def discard_chunks(self):
    async with self.lock:
      self.last_element = None

  async def transcribe_once(self) -> List[TranscriptionResult]:
    '''Transcribe the all enqueued chunks and return the result. 
    Returns empty list if no data or no model.
    '''
    if not self.model:
      return []

    # TODO is this lock really necessary?
    async with self.lock:
      if self.queue.empty():
        return []

      # gather data from queue
      data: List[NDArray[np.float32]] = []
      data_overflow: List[Tuple[int, NDArray[np.float32]]] = []
      
      sample_length = 0
      last_time = None
      start_time = None
      force_complete = False
      max_sample_count_flag = False

      if self.last_element is not None:
        time, sample = self.last_element
        start_time = time
        last_time = time + sample.size // ONE_MS_SAMPLE
        data.append(sample)
        sample_length += sample.size
        self.last_element = None

      while not self.queue.empty():
        _e: Tuple[int, NDArray[np.float32]] = self.queue.get_nowait()
        time, sample = _e

        # try filling the gaps
        if last_time is not None:
          
          if last_time < time:
            if time - last_time > GAP_FILL_MAX:  # leave the data till next iteration
              force_complete = True
              self.last_element = time, sample
              break
            else:  # fill the gaps
              fill = np.zeros(
                  ((time - last_time) * ONE_MS_SAMPLE,), dtype=np.float32)
              data.append(fill)
              sample_length += len(fill)
              
          if last_time > time:
            # separate array
            delta_time = last_time - time
            delta_smpl_length = delta_time * ONE_MS_SAMPLE
            delta_array = sample[:delta_smpl_length]
            
            sample = sample[delta_smpl_length:] if delta_smpl_length < sample.size else None
            data_overflow.append((time, delta_array))
            print(f'last_time > time: {last_time}, {time}')
            time = last_time # shift the time
            
        if sample is None:
          continue

        if start_time is None:
          start_time = time
        last_time = time + sample.size // ONE_MS_SAMPLE
        data.append(sample)
        sample_length += sample.size

        # prevent for too long recognition
        if sample_length > MAX_SAMPLE_COUNT:
          max_sample_count_flag = True
          break

      if not data or start_time is None:
        return []

      # combine data
      data_array = np.concatenate(data, axis=0)
      while start_time != None and data_overflow:
        timestamp, delta_array = data_overflow.pop()
        add_pos = (timestamp - start_time) * ONE_MS_SAMPLE
        data_array[add_pos: add_pos+delta_array.size] += delta_array

      results, incomplete_result, sample_retain = await transcribe_and_segment(
          self.model,
          data_array,
          start_time if start_time else 0,
          force_complete
      )

      if sample_retain < data_array.size:
        self.last_element = (
            start_time + sample_retain // ONE_MS_SAMPLE,
            data_array[sample_retain:]
        )

      if incomplete_result is not None:
        results += [incomplete_result]
      return results
