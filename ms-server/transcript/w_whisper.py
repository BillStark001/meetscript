from typing import Optional, List, Dict, Any

import whisper
import torch
import gc
import numpy as np
import asyncio
import concurrent.futures
from queue import Queue

from transcript.worker import TranscriptionResult, Worker

_executor = concurrent.futures.ThreadPoolExecutor()
_run_async = lambda f, *a: asyncio.get_event_loop().run_in_executor(_executor, f, *a)

ONE_MS_BYTES = np.array([0] * 16, dtype=np.int16).tobytes()
GAP_FILL_MAX = 2000


def convert_segment(s: Dict[str, Any], complete: bool, start_time: int):
  return TranscriptionResult(
      partial=not complete,
      start=int(s['start'] * 1000) + start_time,
      end=int(s['end'] * 1000) + start_time,
      text=s['text'],
  )


class WhisperWorker(Worker):

  def __init__(
          self,
          model: str):

    self.model: Optional[whisper.Whisper] = None
    self.init_params: str = model
    self.queue = asyncio.Queue()

    self.last_element = None

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

  async def enqueue_chunk(self, time: int, sample: bytes):
    if len(sample) % 2 == 1:
      sample = sample[:-1]
    await self.queue.put((time, sample))

  async def transcribe_once(self) -> List[TranscriptionResult]:
    '''Transcribe the all enqueued chunks and return the result. 
    Returns empty list if no data or no model.
    '''
    if not self.model:
      return []
    if self.queue.empty():
      return []

    # gather data from queue
    data = []
    last_time = None
    start_time = None
    force_complete = False

    if self.last_element is not None:
      time, sample = self.last_element
      if len(sample) % 2 == 1:
        sample = sample[:-1]
      start_time = time
      last_time = time + len(sample) // len(ONE_MS_BYTES)
      data.append(sample)
      self.last_element = None

    while not self.queue.empty():
      time, sample = self.queue.get_nowait()

      # try filling the gaps
      if last_time is not None:
        if last_time < time:
          if time - last_time > GAP_FILL_MAX:  # leave the data till next iteration
            force_complete = True
            self.last_element = time, sample
            break
          else:  # fill the gaps
            data.append(ONE_MS_BYTES * (time - last_time))
        if last_time > time:
          print(f'last_time > time: {last_time}, {time}')
          time = last_time  # shift the time for now

      if len(sample) % 2 == 1:
        sample = sample[:-1]
      if start_time is None:
        start_time = time
      last_time = time + len(sample) // len(ONE_MS_BYTES)
      data.append(sample)

    if not data or start_time is None:
      return []

    data_bytes = b''.join(data)
    data_array = np.frombuffer(data_bytes, dtype=np.int16) \
        .flatten().astype(np.float32) / 32768.0

    # run the model
    segments: List[Dict[str, Any]] = (await _run_async(
        lambda: self.model.transcribe(
            data_array, fp16=torch.cuda.is_available()
        )))['segments']

    incomplete_segment = None if force_complete or len(
        segments) == 0 else segments[-1]
    complete_segments = segments if incomplete_segment is None else segments[:-1]

    result = []

    # handle complete segments
    result.extend(convert_segment(s, True, start_time)
                  for s in complete_segments)

    # handle incomplete segments
    if incomplete_segment is not None:
      
      assert self.last_element is None, 'incomplete segment and last element should be mutually exclusive'
      split_start = int(incomplete_segment['start'] * 1000) * len(ONE_MS_BYTES)
      incomplete_result = convert_segment(incomplete_segment, False, start_time)
      new_time_start = incomplete_result.start
      new_sample = data_bytes[split_start:]
      
      # store the remaining audio data to the next iteration
      self.last_element = new_time_start, new_sample
      result.append(incomplete_result)
      
    return result
