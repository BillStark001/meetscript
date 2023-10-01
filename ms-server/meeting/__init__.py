from typing import Optional

import uuid
from datetime import datetime
from pydantic import BaseModel

from fastapi import Depends

from base import app
from user.model import User
from user.auth import CurrentUser
from constants import Token


class InitParams(BaseModel):
  id: Optional[str] = None
  name: Optional[str] = None
  time: Optional[datetime] = None


@app.post('/api/meet/init')
async def init(
    form_data: InitParams,
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
):
  return {'detail': 'nie', 'user': user.email if user else None}


@app.post('/api/meet/close')
async def close(
    user: User = Depends(CurrentUser(Token.Access.Meeting.InitOrClose))
):
  return {'detail': 'nie', 'user': user.email if user else None}
