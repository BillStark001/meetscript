import asyncio
import peewee as pw
import peewee_async as pwa
from datetime import datetime

from typing import Optional

import user.format as f
from constants import Codes, UserGroup
from utils.sqlite import AsyncSqliteDatabase


# database

db = AsyncSqliteDatabase('./users.sqlite')
objects = pwa.Manager(db)

def initialize_db():
  db.connect()
  db.create_tables([User], safe = True)
  db.close()
  db.set_allow_sync(False)

class User(pw.Model):

  email = pw.CharField(unique=True, max_length=32)
  pw_hash = pw.CharField(max_length=128)
  pw_update = pw.DateTimeField(default=datetime.utcfromtimestamp(0))

  username = pw.CharField(max_length=32)
  group=pw.CharField(max_length=64)
  

  class Meta:
    database = db

  def set_username(self, username: str, save=True):
    if not f.is_valid_username(username):
      return Codes.ERR_INVALID_USERNAME
    self.username = username
    if save:
      self.save()
    return Codes.DONE

  def set_password(self, password: str, save=True):
    if not f.is_valid_password(password):
      return Codes.ERR_INVALID_PASSWORD
    self.pw_hash = f.encode_password(password)
    self.pw_update = datetime.utcnow()
    if save:
      self.save()
    return Codes.DONE
  

guest_user = User(email='__guest__', pw_hash='', username='guest', group=UserGroup.Guest)


async def create_user(email: str, username: str, password: str, group: str = UserGroup.User):

  if not f.is_valid_email(email):
    return Codes.ERR_INVALID_EMAIL
  if not f.is_valid_username(username):
    return Codes.ERR_INVALID_USERNAME
  if not f.is_valid_password(password):
    return Codes.ERR_INVALID_PASSWORD

  pw_hash = f.encode_password(password)
  
  try:
    await objects.create(
      User, 
      email=email, 
      username=username, 
      pw_hash=pw_hash, 
      pw_update=datetime.utcnow(),
      group=group
    )
    return Codes.DONE
  except pw.IntegrityError as e: 
    return Codes.ERR_EXISTENT_EMAIL


async def authenticate_user(email: str, password: str):
  try:
    user = await objects.get(User, User.email == email)
    if f.verify_password(password, user.pw_hash):
      return Codes.DONE, user
    else:
      return Codes.ERR_WRONG_UNAME_OR_PW, None
  except User.DoesNotExist:
    return Codes.ERR_WRONG_UNAME_OR_PW, None


async def get_user(email: str) -> Optional[User]:
  try:
    user = await objects.get(User, User.email == email)
    return user
  except User.DoesNotExist:
    return None
