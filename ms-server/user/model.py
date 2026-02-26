import asyncio
from datetime import datetime

from typing import Optional, Tuple

from sqlalchemy import Column, Integer, String, DateTime, select, update
from sqlalchemy.exc import IntegrityError

import user.format as f
from constants import Codes, UserGroup
from utils.db import Base, AsyncSessionLocal

import uuid


class User(Base):
  __tablename__ = 'users'

  id = Column(Integer, primary_key=True, autoincrement=True)
  email = Column(String(32), unique=True, nullable=False)
  pw_hash = Column(String(128), nullable=False, default='')
  pw_update = Column(DateTime, nullable=False, default=lambda: datetime.utcfromtimestamp(0))
  username = Column(String(32), nullable=False, default='')
  group = Column(String(64), nullable=False, default='')

  async def set_username(self, username: str, save=True):
    if not f.is_valid_username(username):
      return Codes.ERR_INVALID_USERNAME
    self.username = username
    if save:
      async with AsyncSessionLocal() as session:
        await session.execute(
            update(User).where(User.id == self.id).values(username=username)
        )
        await session.commit()
    return Codes.DONE

  async def set_password(self, password: str, save=True):
    if not f.is_valid_password(password):
      return Codes.ERR_INVALID_PASSWORD
    self.pw_hash = f.encode_password(password)
    self.pw_update = datetime.utcnow()
    if save:
      async with AsyncSessionLocal() as session:
        await session.execute(
            update(User).where(User.id == self.id).values(
                pw_hash=self.pw_hash, pw_update=self.pw_update
            )
        )
        await session.commit()
    return Codes.DONE


guest_user = User(
    email='__guest__',
    pw_hash='',
    username='guest',
    group=UserGroup.Guest,
    pw_update=datetime.utcfromtimestamp(0),
)


def initialize_db():
  async def _init():
    from utils.db import engine
    async with engine.begin() as conn:
      await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
      result = await session.execute(select(User).where(User.email == '__root__'))
      if result.scalar_one_or_none() is None:
        root_pw = str(uuid.uuid1())
        session.add(User(
            email='__root__',
            username='root',
            pw_hash=f.encode_password(root_pw),
            pw_update=datetime.utcnow(),
            group=UserGroup.Root,
        ))
        await session.commit()
        with open('./root_pwd.txt', 'w') as fp:
          fp.write(root_pw)

  try:
    loop = asyncio.get_running_loop()
    loop.create_task(_init())
  except RuntimeError:
    asyncio.run(_init())


async def create_user(email: str, username: str, password: str, group: str = UserGroup.User):
  if not f.is_valid_email(email):
    return Codes.ERR_INVALID_EMAIL
  if not f.is_valid_username(username):
    return Codes.ERR_INVALID_USERNAME
  if not f.is_valid_password(password):
    return Codes.ERR_INVALID_PASSWORD

  pw_hash = f.encode_password(password)

  try:
    async with AsyncSessionLocal() as session:
      session.add(User(
          email=email,
          username=username,
          pw_hash=pw_hash,
          pw_update=datetime.utcnow(),
          group=group,
      ))
      await session.commit()
    return Codes.DONE
  except IntegrityError:
    return Codes.ERR_EXISTENT_EMAIL


async def authenticate_user(email: str, password: str) -> Tuple[int, Optional[User]]:
  async with AsyncSessionLocal() as session:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
  if user is None:
    return Codes.ERR_WRONG_UNAME_OR_PW, None
  if f.verify_password(password, user.pw_hash):
    return Codes.DONE, user
  return Codes.ERR_WRONG_UNAME_OR_PW, None


async def get_user(email: str) -> Optional[User]:
  async with AsyncSessionLocal() as session:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

