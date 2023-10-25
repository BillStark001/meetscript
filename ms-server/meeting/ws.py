from typing import Any, Optional, Set, Callable, Tuple
from numpy.typing import NDArray
import dataclasses

import sys
import numpy as np
import asyncio
import struct
import json

from fastapi import WebSocket
from starlette.websockets import WebSocketState, WebSocketDisconnect

from base import app
from user import User
from user.auth import get_current_user_ws
from constants import Token, Codes, getDescriptionWs
from utils.web import EventBasedWebSocketHandler

from meeting.handler import MeetingHandler
from meeting.model import TranslationResult

from transcribe.worker import TranscriptionResult

_handler: Optional[MeetingHandler] = None
_active_sockets: Set['ConsumerHandler'] = set()

def get_handler():
  global _handler
  return _handler

def set_handler(h: Optional[MeetingHandler]):
  global _handler
  _handler = h

async def send_transcription(
  data_tc: Optional[TranscriptionResult],
  data_tl: Optional[TranslationResult],
):
  if data_tc is None:
    if data_tl is not None:
      print(data_tl)
    return
  
  dead_sockets = []
  crs = []
  for s in _active_sockets:
    if s.socket.client_state == WebSocketState.DISCONNECTED:
      dead_sockets.append(s)
      continue
    crs.append(s.send(dataclasses.asdict(data_tc)))
  await asyncio.gather(*crs)
  for s in dead_sockets:
    if s in _active_sockets:
      _active_sockets.remove(s)


_emnsw = getDescriptionWs(Codes.ERR_MEETING_NOT_STARTED)
_eauth = getDescriptionWs(Codes.ERR_AUTH_FAILED)


def _j(x: bytes):
  try:
    return json.loads(x)
  except:
    return None


def float32_to_int16(audio_data_raw: bytes) -> bytes:
  audio_data_arr = np.frombuffer(audio_data_raw, dtype=np.float32) * 0x8000
  audio_data_arr[audio_data_arr > 0x7fff] = 0x7fff
  audio_data = audio_data_arr.astype(np.int16).tobytes()
  return audio_data


def int16_endian_cvrt(big_endian_array: bytes, le2be: bool = False) -> bytes:
  big_endian_array = np.frombuffer(
      big_endian_array, dtype=np.dtype('<f2' if le2be else '>f2'))
  little_endian_array = big_endian_array.astype('>f2' if le2be else '<f2')
  little_endian_buffer = little_endian_array.tobytes()
  return little_endian_buffer


class ConsumerHandler(EventBasedWebSocketHandler):
  def __init__(self, websocket: WebSocket, token: str):
    super().__init__(websocket)
    self.token = token

  async def on_connect(self, *args, **kwargs) -> None:
    global _active_sockets
    user = await get_current_user_ws(self.token, Token.Access.Meeting.Consume)
    if user is None:
      await self.close(**_eauth)
      return
    if _handler is None:
      await self.close(**_emnsw)
      return
    
    self.user = user
    await self.accept()
    # send message to user to start
    await self.send({'code': 0, 'detail': 'Connection Accepted.'})
    
    _active_sockets.add(self)
    
  async def on_disconnect(self, code: int = -1, reason: Any | None = None) -> None:
    global _active_sockets
    if self in _active_sockets:
      _active_sockets.remove(self)
      
  async def on_receive(self, text: str | None, bytes: bytes | None) -> None:
    await asyncio.sleep(0.01)
    input_json = _j(text if text else (bytes.decode('utf-8') if bytes else ''))
    if input_json is None:  # only accept json data
      return
    if input_json is not None and input_json.get('code') == 1:
      await self.close()  # under user request
    

class ProviderHandler(EventBasedWebSocketHandler):
  
  def __init__(self, websocket: WebSocket, token: str, format: str):
    super().__init__(websocket)
    self.token = token
    self.format = format
    self.user: Optional[User] = None
    self.addr: Tuple[str, int] = ('', 0)
    
    
    # prepare audio handler
    audio_handler: Callable[[bytes], NDArray] = lambda x: np.frombuffer(x, dtype=np.float32)
    # TODO handle int16 data if necessary
    
    # if format == 'int16be' and sys.byteorder != 'big':
    #   audio_handler = int16_endian_cvrt
    # elif (format == 'int16' or format == 'int16le') and sys.byteorder == 'big':
    #   def audio_handler(x): return int16_endian_cvrt(x, True)
      
    self.audio_handler = audio_handler
    
  
  async def on_connect(self, *args, **kwargs) -> None:
    global _handler
    user = await get_current_user_ws(self.token, Token.Access.Meeting.Provide)
    if user is None:
      await self.close(**_eauth)
      return
    if _handler is None:
      await self.close(**_emnsw)
      return
    
    self.user = user
    await self.accept()
    # send message to user to start
    await self.send({'code': 0, 'detail': 'Connection Accepted.'})
    self.addr = (self.socket.client.host, self.socket.client.port)
    
  async def on_disconnect(self, code: int = -1, reason: Optional[Any] = None) -> None:
    global _handler
    if _handler:
      _handler.del_provider(self.addr)
      
  async def on_receive(self, text: Optional[str], bytes: Optional[bytes]) -> None:
    global _handler
    user_input = bytes or (text.encode('utf-8') if text else b'')
    await asyncio.sleep(0.01)
    
    # see if it is control data
    input_json = _j(user_input)
    if input_json is not None and input_json.get('code') == 1:
      await self.close()  # under user request
      
    # else treat it like formed data
    if not _handler:
      await self.close()
    if not _handler.provider_active(self.addr):
      return  # discard since the handler is receiving somewhere else

    timestamp_millis = struct.unpack('>Q', user_input[:8])[0]
    # time_obj = datetime.utcfromtimestamp(timestamp_millis / 1000)
    audio_data_raw = user_input[8:]
    audio_data = self.audio_handler(audio_data_raw)
    # sr=16000, d=16bit
    await _handler.enqueue_audio_data(timestamp_millis, audio_data)
  

@app.websocket('/ws/meet/provide')
async def provide(websocket: WebSocket, token: str, format: str):
  h = ProviderHandler(websocket, token, format)
  await h.work()

@app.websocket('/ws/meet/consume')
async def consume(websocket: WebSocket, token: str):
  h = ConsumerHandler(websocket, token)
  await h.work()


