from typing import Optional

from datetime import datetime
from datetime import datetime
from pydantic import BaseModel

from fastapi import Depends, HTTPException

from base import app, BaseResponseModel, TokenResponseModel
from user.model import User
from user.auth import CurrentUser, create_jwt_token
from constants import Token, Codes, getDescriptionHttp
from config import AppConfig

from meeting.model import initialize_db
from meeting.handler import MeetingHandler
from meeting.ws import send_transcription, get_handler, set_handler



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


@app.get('/api/meet/ws_request', response_model_exclude_none=True)
async def request_websocket(
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose)),
    provider: bool = False,
) -> TokenResponseModel:
  return TokenResponseModel(
      detail={'user': user.email if user else None},
      access_token=create_jwt_token(
          user,
          (Token.Access.Meeting.Provide if provider else Token.Access.Meeting.Consume).value,
          AppConfig.AccessTokenExpires
      )
  )


initialize_db()
