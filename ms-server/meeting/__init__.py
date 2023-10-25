from typing import Optional

from datetime import datetime
from datetime import datetime
from pydantic import BaseModel

from fastapi import Depends, HTTPException, WebSocket

from base import app, BaseResponseModel, TokenResponseModel
from user.model import User
from user.auth import CurrentUser, create_jwt_token
from constants import Token, Codes, getDescriptionHttp
from config import AppConfig

from meeting.model import initialize_db
from meeting.handler import MeetingHandler
from meeting.ws import send_transcription, get_handler, set_handler, ProviderHandler, ConsumerHandler



class InitParams(BaseModel):
  session: Optional[str] = None
  name: Optional[str] = None
  time: Optional[datetime] = None


_emst = getDescriptionHttp(Codes.ERR_MEETING_STARTED)
_emns = getDescriptionHttp(Codes.ERR_MEETING_NOT_STARTED)


@app.post('/api/meet/init', response_model_exclude_none=True)
async def init(
    form_data: InitParams,
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
) -> BaseResponseModel:
  if get_handler() is not None:
    raise HTTPException(**_emst)
  h = MeetingHandler(
      callback=send_transcription,
      session=form_data.session,
      name=form_data.name,
      time=form_data.time
  )
  set_handler(h)
  await h.init()
  h.start_providing()
  return BaseResponseModel(detail={'user': user.email if user else None})


@app.post('/api/meet/close', response_model_exclude_none=True)
async def close(
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
) -> BaseResponseModel:
  h = get_handler()
  if h is None:
    raise HTTPException(**_emns)
  h.stop_providing()
  await h.close()
  set_handler(None)
  return BaseResponseModel(detail={'user': user.email if user else None})


# websocket related

def request_websocket(
    user: User,
    provider: bool,
) -> TokenResponseModel:
  return TokenResponseModel(
      detail={'user': user.email if user else None},
      access_token=create_jwt_token(
          user,
          (Token.Access.Meeting.Provide if provider else Token.Access.Meeting.Consume).value,
          AppConfig.AccessTokenExpires
      )
  )

@app.get('/api/meet/ws_request/provide', response_model_exclude_none=True)
async def request_websocket(
    user: User = Depends(CurrentUser(Token.Access.Meeting.Provide)),
) -> TokenResponseModel:
  return request_websocket(user, True)

@app.get('/api/meet/ws_request/consume', response_model_exclude_none=True)
async def request_websocket(
    user: User = Depends(CurrentUser(Token.Access.Meeting.Consume)),
) -> TokenResponseModel:
  return request_websocket(user, False)

@app.websocket('/ws/meet/provide')
async def provide(websocket: WebSocket, token: str, format: str):
  h = ProviderHandler(websocket, token, format)
  await h.work()

@app.websocket('/ws/meet/consume')
async def consume(websocket: WebSocket, token: str):
  h = ConsumerHandler(websocket, token)
  await h.work()


# data

@app.get('/api/meet/data')
async def download_data(
    time_start: datetime,
    time_end: Optional[datetime] = None,
    user: User = Depends(CurrentUser(Token.Access.Meeting.Data)),
):
  # TODO
  return '[]'


initialize_db()
