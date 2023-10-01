from typing import Optional

import uuid
from datetime import datetime
from pydantic import BaseModel

from fastapi import Depends, HTTPException

from base import app
from user.model import User
from user.auth import CurrentUser
from constants import Token, Codes, getDescription

from meeting.model import add_record, fetch_records, initialize_db
from meeting.handler import MeetingHandler

_handler: Optional[MeetingHandler] = None

class InitParams(BaseModel):
  session: Optional[str] = None
  name: Optional[str] = None
  time: Optional[datetime] = None

_, _st_desc, _st_code = getDescription(Codes.ERR_MEETING_STARTED)
_, _nt_desc, _nt_code = getDescription(Codes.ERR_MEETING_NOT_STARTED)

@app.post('/api/meet/init')
async def init(
    form_data: InitParams,
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
):
  global _handler
  if _handler is not None:
    raise HTTPException(status_code=_st_code, detail=_st_desc)
  _handler = MeetingHandler(
    session=form_data.session,
    name=form_data.name,
    time=form_data.time
  )
  await _handler.init()
  return {'detail': 'Done.', 'user': user.email if user else None}


@app.post('/api/meet/close')
async def close(
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
):
  global _handler
  if _handler is None:
    raise HTTPException(status_code=_nt_code, detail=_nt_desc)
  await _handler.close()
  _handler = None
  return {'detail': 'Done.', 'user': user.email if user else None}


initialize_db()