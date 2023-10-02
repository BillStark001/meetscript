import asyncio
from typing import Optional, Callable

from pydantic import BaseModel, Field
from datetime import datetime
from queue import Queue

from fastapi import WebSocket

from transcript.worker import Worker, TranscriptionResult
from transcript.w_whisper import WhisperWorker

from meeting.model import initialize_db, add_record


class MeetingHandler:

  def __init__(
      self,
      callback: Callable[[TranscriptionResult], asyncio.Task],
      session: str = 'default',
      name: Optional[str] = None,
      time: Optional[datetime] = None,
      work_duration: float = 0.3, # in seconds
      dummy_threshold: int = 4,
  ):
    self.callback = callback
    self.session = session or 'default'
    self.name = name
    self.work_duration = work_duration
    self.dummy_threshold = dummy_threshold
    self.time = time if time is not None else datetime.utcnow()

    self.worker: Optional[Worker] = None
    self.provider_set = set()
    self.provider: Optional[tuple] = None
    self.dummy_work_count = 0
    self.last_result: Optional[TranscriptionResult] = None
    self.provider_task: Optional[asyncio.Task] = None
    

  async def init(self):
    if self.worker is None:
      self.worker = WhisperWorker('medium')
    initialize_db(self.session)
    await self.worker.init_model()

  async def close(self):
    await self.worker.close_model()
    del self.worker
    self.worker = None

  def add_provider(self, provider: tuple):
    self.provider_set.add(provider)

  def del_provider(self, provider: tuple):
    if provider in self.provider_set:
      self.provider_set.remove(provider)
    if self.provider == provider:
      self.provider = None 

  def pick_provider(self):
    if len(self.provider_set) > 0:
      self.provider = next(iter(self.provider_set))

  def provider_active(self, provider: tuple):
    if self.provider is None:
      self.add_provider(provider)
      self.provider = provider
      return True
    return self.provider == provider

  async def enqueue_audio_data(self, time: int, data: bytes):
    await self.worker.enqueue_chunk(time, data)
    
  async def run_transcription_once(self):
    res = await self.worker.transcribe_once()
    if not res and self.dummy_work_count < self.dummy_threshold:
      self.dummy_work_count += 1
    if res:
      self.dummy_work_count = 0
    # in case no data for too long time
    # clear the last result if necessary
    if self.dummy_work_count >= self.dummy_threshold and self.last_result is not None:
      self.last_result.partial = False
      res = [self.last_result]
      self.last_result = None
      
    for result_raw in res:
      if not result_raw.partial:
        # store the result into db
        await add_record(
          self.session, 
          datetime.utcfromtimestamp(result_raw.start / 1000), 
          result_raw.text,
          result_raw.lang,
        )
      await self.callback(result_raw)
      
  def start_providing(self):
    
    async def _task():
      try:
        while self.worker is not None:
          await self.run_transcription_once()
          await asyncio.sleep(self.work_duration)
      except asyncio.CancelledError as e:
        print(e)
        pass
      return True
    
    async def _task_done(*args):
      del self.provider_task
      self.provider_task = None
    
    self.provider_task = asyncio.create_task(_task())
    self.provider_task.add_done_callback(_task_done)
    
  def stop_providing(self):
    if not self.provider_task:
      return
    self.provider_task.cancel()
    self.provider_task = None
        
    
    
    
