import abc
import asyncio
from typing import List
from dataclasses import dataclass
import numpy as np
from numpy.typing import NDArray
import datetime


class TranslateWorker(abc.ABC):

  @abc.abstractmethod
  async def translate(self, text: str, target_language: str) -> str:
    pass