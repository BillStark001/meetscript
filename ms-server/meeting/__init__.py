from typing import Optional, Set, Callable
import dataclasses

import uuid
import sys
import numpy as np
import asyncio
import struct
from datetime import datetime
import json
from datetime import datetime
from pydantic import BaseModel

from fastapi import Depends, HTTPException, WebSocket
from starlette.websockets import WebSocketState

from base import app
from user.model import User
from user.auth import CurrentUser, create_jwt_token, get_current_user_ws
from constants import Token, Codes, getDescriptionHttp, getDescriptionWs
from config import AppConfig

from meeting.model import add_record, fetch_records, initialize_db
from meeting.handler import MeetingHandler

from transcript.worker import TranscriptionResult

_handler: Optional[MeetingHandler] = None
_active_sockets: Set[WebSocket] = set()

async def _send_transcription(data: TranscriptionResult):
  dead_sockets = []
  crs = []
  for s in _active_sockets:
    if s.application_state == WebSocketState.DISCONNECTED:
      dead_sockets.append(s)
      continue
    crs.append(s.send_json(dataclasses.asdict(data)))
  await asyncio.gather(*crs)
  for s in dead_sockets:
    if s in _active_sockets:
      _active_sockets.remove(s)
    

class InitParams(BaseModel):
  session: Optional[str] = None
  name: Optional[str] = None
  time: Optional[datetime] = None


_emst = getDescriptionHttp(Codes.ERR_MEETING_STARTED)
_emns = getDescriptionHttp(Codes.ERR_MEETING_NOT_STARTED)


@app.post('/api/meet/init')
async def init(
    form_data: InitParams,
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
):
  global _handler
  if _handler is not None:
    raise HTTPException(**_emst)
  _handler = MeetingHandler(
      callback=_send_transcription,
      session=form_data.session,
      name=form_data.name,
      time=form_data.time
  )
  await _handler.init()
  _handler.start_providing()
  return {'detail': 'Done.', 'user': user.email if user else None}


@app.post('/api/meet/close')
async def close(
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
):
  global _handler
  if _handler is None:
    raise HTTPException(**_emns)
  _handler.stop_providing()
  await _handler.close()
  _handler = None
  return {'detail': 'Done.', 'user': user.email if user else None}


@app.get('/api/meet/ws_request')
async def request_websocket(
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose)),
    provider: bool = False,
):
  return {
      'detail': 'Done.',
      'user': user.email if user else None,
      'access_token': create_jwt_token(
          user,
          (Token.Access.Meeting.Provide if provider else Token.Access.Meeting.Consume).value,
          AppConfig.AccessTokenExpires
      )
  }


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
  big_endian_array = np.frombuffer(big_endian_array, dtype=np.dtype('<f2' if le2be else '>f2'))
  little_endian_array = big_endian_array.astype('>f2' if le2be else '<f2')
  little_endian_buffer = little_endian_array.tobytes()
  return little_endian_buffer

@app.websocket('/ws/meet/provide')
async def provide(websocket: WebSocket, token: str, format: str):
  global _handler
  global _active_sockets
  # authenticate
  await websocket.accept()
  user = await get_current_user_ws(token, Token.Access.Meeting.Provide)
  if user is None:
    await websocket.close(**_eauth)
    return
  if _handler is None:
    await websocket.close(**_emnsw)
    return

  # send message to user to start
  await websocket.send_json({'code': 0, 'detail': 'Connection Accepted.'})
  provider_addr = (websocket.client.host, websocket.client.port)
  _active_sockets.add(websocket)
  
  # prepare audio handler
  audio_handler: Callable[[bytes], bytes] = lambda x: x
  if format == 'int16be' and sys.byteorder != 'big':
    audio_handler = int16_endian_cvrt
  elif (format == 'int16' or format == 'int16le') and sys.byteorder == 'big':
    audio_handler = lambda x: int16_endian_cvrt(x, True)
  elif format == 'float32':
    audio_handler = float32_to_int16
  
  try:
    while True:
      user_input = await websocket.receive_bytes()
      await asyncio.sleep(0.01)
      # see if it is control data
      input_json = _j(user_input)
      if input_json is not None and input_json.get('code') == 1:
        break  # under user request
      # else treat it like formed data
      if not _handler:
        break
      if not _handler.provider_active(provider_addr): 
        continue  # discard since the handler is receiving somewhere else

      timestamp_millis = struct.unpack('>Q', user_input[:8])[0]
      # time_obj = datetime.utcfromtimestamp(timestamp_millis / 1000)
      audio_data_raw = user_input[8:]  
      audio_data = audio_handler(audio_data_raw)
      # sr=16000, d=16bit
      await _handler.enqueue_audio_data(timestamp_millis, audio_data)

  finally:
    if _handler:
      _handler.del_provider(provider_addr)
    _active_sockets.remove(websocket)
    try:
      await websocket.close()
    except RuntimeError:
      pass

  pass

initialize_db()
