import abc
import asyncio
from typing import List
from dataclasses import dataclass
import numpy as np
from numpy.typing import NDArray
import datetime


class Worker(abc.ABC):

  @abc.abstractmethod
  async def init_model(self):
    pass

  @abc.abstractmethod
  async def close_model(self):
    pass

  @abc.abstractmethod
  async def enqueue_chunk(self, time: int, sample: NDArray[np.float32]):
    pass

  @abc.abstractmethod
  async def discard_chunks(self):
    pass

  @abc.abstractmethod
  async def transcribe_once(self) -> List['TranscriptionResult']:
    '''Transcribe all enqueued chunks and return the result.
    Returns an empty list if there is no data or no model.
    '''
    pass


@dataclass
class TranscriptionResult:

  partial: bool = False
  start: int = 0
  end: int = 0
  text: str = ''
  lang: str = ''

  def __str__(self) -> str:
    formatted_time = datetime.datetime.utcfromtimestamp(
        self.start / 1000).strftime('%H:%M:%S.%f')[:-3]
    return f'[{self.lang},{formatted_time}+{(self.end - self.start) / 1000}{"P" if self.partial else ""}] {self.text}'
