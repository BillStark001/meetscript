from typing import Optional

from pydantic import BaseModel, Field
from datetime import datetime

from transcript.worker import Worker, TranscriptionResult
from transcript.w_whisper import WhisperWorker

from meeting.model import initialize_db

class MeetingHandler:
  
  def __init__(
    self, 
    session: str = 'default',
    name: Optional[str] = None,
    time: Optional[datetime] = None,
  ):
    self.session = session or 'default'
    self.name = name
    self.time = time if time is not None else datetime.utcnow()
    
    self.worker: Optional[Worker] = None
    
  async def init(self):
    if self.worker is None:
      self.worker = WhisperWorker('small')
    initialize_db(self.session)
    await self.worker.init_model()
    
  async def close(self):
    await self.worker.close_model()
    del self.worker
    self.worker = None
    
    
  
    
  
