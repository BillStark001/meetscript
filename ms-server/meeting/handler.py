import asyncio
from typing import Optional, Callable
from numpy.typing import NDArray
import numpy as np

from datetime import datetime

from transcribe.worker import TranscribeWorker, TranscriptionResult
from transcribe.w_whisper import WhisperWorker

from translate.worker import TranslateWorker
from translate.w_deepl import DeepLWorker

from config import AppConfig

from meeting.model import initialize_db, add_record, update_translations, TranslationResult

DEBUG_MODE = False

class MeetingHandler:

  def __init__(
      self,
      callback: Callable[[Optional[TranscriptionResult], Optional[TranslationResult]], asyncio.Task],
      session: str = 'default',
      name: Optional[str] = None,
      time: Optional[datetime] = None,
      work_duration: float = 0.7, # in seconds
      dummy_threshold: int = 4,
  ):
    self.callback = callback
    self.session = session or 'default'
    self.name = name
    self.work_duration = work_duration
    self.dummy_threshold = dummy_threshold
    self.time = time if time is not None else datetime.utcnow()

    self.tc_worker: Optional[TranscribeWorker] = None
    self.tl_worker: Optional[TranslateWorker] = None
    self.provider_set = set()
    self.provider: Optional[tuple] = None
    self.dummy_work_count = 0
    self.last_result: Optional[TranscriptionResult] = None
    self.provider_task: Optional[asyncio.Task] = None
    
    self.lock = asyncio.Lock()
    

  async def init(self):
    if self.tc_worker is None:
      self.tc_worker = WhisperWorker('medium')
    if self.tl_worker is None:
      self.tl_worker = DeepLWorker(AppConfig.DeepLAuthKey, AppConfig.DeepLFreePlan)
      
    initialize_db(self.session)
    await self.tc_worker.init_model()
    self.dummy_work_count = 0

  async def close(self):
    await self.tc_worker.close_model()
    del self.tc_worker
    self.tc_worker = None

  # provider

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


  def start_providing(self):
    
    in_transcrition = False
    
    async def _task():
      nonlocal in_transcrition
      try:
        while self.tc_worker is not None:
          
          await self.run_transcription_once()
          await asyncio.sleep(self.work_duration * 0.2)
          
          await self.run_translation_once()
          await asyncio.sleep(self.work_duration * 0.8)
          
      except asyncio.CancelledError as e:
        print('Task Cancelled.')
        return False
      return True
    
    def _task_done(_):
      e = self.provider_task.exception()
      del self.provider_task
      self.provider_task = None
      if e is not None and not isinstance(e, asyncio.CancelledError):
        raise e
    
    self.provider_task = asyncio.create_task(_task())
    self.provider_task.add_done_callback(_task_done)
    
  def stop_providing(self):
    if not self.provider_task:
      return
    self.provider_task.cancel()
    self.provider_task = None


  async def enqueue_audio_data(self, time: int, data: NDArray[np.float32]):
    async with self.lock:
      await self.tc_worker.enqueue_chunk(time, data)
      self.dummy_work_count = 0
    
    # if not self.provider_task:
    #   self.start_providing()
    
  # transcription
    
  async def run_transcription_once(self):
    res = []
    do_transcribe = False
    async with self.lock:
      
      if self.dummy_work_count < self.dummy_threshold:
        self.dummy_work_count += 1
        do_transcribe = True
      current_dummy_work_count = self.dummy_work_count
    
      if do_transcribe:
        res = await self.tc_worker.transcribe_once()
      
      # in case no data for too long time
      # clear the last result if necessary
      
      flag1 = False
      if current_dummy_work_count >= self.dummy_threshold and self.last_result is not None:
        flag1 = True
        self.last_result.partial = False
        res = [self.last_result] + res
        self.last_result = None
        await self.tc_worker.discard_chunks()
        
      if DEBUG_MODE and res:
        print('W', flag1, self.tc_worker.last_element[0] if self.tc_worker.last_element else '-')
        if self.last_result:
          print('L', self.last_result)
        for _ in res:
          print(' ', _)
        print()
        
      for result_raw in res:
        if not result_raw.partial:
          # store the result into db
          await add_record(
            self.session, 
            datetime.utcfromtimestamp(result_raw.start / 1000), 
            result_raw.text,
            result_raw.lang,
          )
        else:
          self.last_result = result_raw
        await self.callback(result_raw, None)
        
  # translation
        
  async def handle_translation(self, src: str, dst: str, txt: str):
    if src == dst:
      return txt
    return await self.tl_worker.translate(txt, dst)
  
  async def handle_translated(self, result: TranslationResult):
    await self.callback(None, result)
        
  async def run_translation_once(self):
    await update_translations(
      self.handle_translation,
      self.session,
      datetime.utcfromtimestamp(1),
      AppConfig.TranslationTarget,
      self.handle_translated,
    )
    
    
    
