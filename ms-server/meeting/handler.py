import asyncio
from typing import Optional

from pydantic import BaseModel, Field
from datetime import datetime
from queue import Queue

from fastapi import WebSocket

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
    self.provider_set = set()
    self.provider: Optional[tuple] = None

  async def init(self):
    if self.worker is None:
      self.worker = WhisperWorker('small')
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
