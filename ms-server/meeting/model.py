import asyncio
import os
from datetime import datetime, timezone
from dataclasses import dataclass

from typing import Optional, Callable, Iterable

from sqlalchemy import Column, Integer, String, DateTime, Text, select
from sqlalchemy.exc import IntegrityError

from constants import Codes
from utils.db import Base, AsyncSessionLocal
from utils.object import format_time


class MeetingRecord(Base):
  __tablename__ = 'meeting_records'

  id = Column(Integer, primary_key=True, autoincrement=True)
  session = Column(String(36), nullable=False, default='')
  time = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.fromtimestamp(0, tz=timezone.utc))
  lang = Column(String(8), nullable=False, default='')
  text = Column(Text, nullable=False, default='')
  translate1 = Column(Text, nullable=False, default='')
  translate2 = Column(Text, nullable=False, default='')
  translate3 = Column(Text, nullable=False, default='')
  translate4 = Column(Text, nullable=False, default='')


_TRANSLATE_ORDER = {
    'en': (1, 'translate1'),
    'jp': (2, 'translate2'),
    'zh': (3, 'translate3'),
}


def initialize_db(target: str = 'default'):
  async def _init():
    from utils.db import engine
    async with engine.begin() as conn:
      await conn.run_sync(Base.metadata.create_all)

  try:
    loop = asyncio.get_running_loop()
    loop.create_task(_init())
  except RuntimeError:
    asyncio.run(_init())


async def add_record(
    session: str,
    time: datetime,
    text: str,
    lang: Optional[str] = None,
):
  try:
    i, col_name = _TRANSLATE_ORDER.get(lang, (-1, None))
    kwargs = {} if i < 0 else {col_name: text}
    async with AsyncSessionLocal() as db_session:
      db_session.add(MeetingRecord(
          session=session,
          time=time,
          text=text,
          lang=lang or '',
          **kwargs,
      ))
      await db_session.commit()
  except IntegrityError:
    return Codes.ERR_SESSION_DB


async def fetch_records(
    session: str,
    time_start: datetime,
    time_end: Optional[datetime] = None,
    lang: Optional[str] = None,
):
  stmt = select(MeetingRecord).where(
      MeetingRecord.session == session,
      MeetingRecord.time >= time_start,
  )
  if time_end is not None:
    stmt = stmt.where(MeetingRecord.time <= time_end)
  if lang is not None and lang != '':
    stmt = stmt.where(MeetingRecord.lang.startswith(lang))
  async with AsyncSessionLocal() as db_session:
    result = await db_session.execute(stmt)
    return result.scalars().all()


# translation related

@dataclass
class TranslationResult:
  start: int = 0
  text: str = ''
  lang: str = ''
  translated: str = ''

  def __str__(self) -> str:
    return f'[{self.lang},{format_time(datetime.fromtimestamp(self.start / 1000, tz=timezone.utc))}] {self.text} -> {self.translated}'


async def update_translations(
    f_translate: Callable[[str, str, str], asyncio.Task],
    session_value: Optional[str],
    time_threshold: datetime,
    language: str,
    f_callback: Optional[Callable[['TranslationResult'], asyncio.Task]] = None,
):
  lang_id, col_name = _TRANSLATE_ORDER.get(language, (-1, None))
  if not col_name:
    return False

  col_attr = getattr(MeetingRecord, col_name)

  stmt = select(MeetingRecord).where(
      MeetingRecord.time > time_threshold,
      MeetingRecord.lang != language,
      col_attr == '',
  )
  if session_value:
    stmt = stmt.where(MeetingRecord.session == session_value)

  async with AsyncSessionLocal() as db_session:
    result = await db_session.execute(stmt)
    records = result.scalars().all()

    for record in records:
      translated_text = await f_translate(record.lang, language, record.text)
      setattr(record, col_name, translated_text)
      if f_callback:
        ts = int(record.time.replace(tzinfo=timezone.utc).timestamp() * 1000)
        res = TranslationResult(ts, record.text, record.lang, translated_text)
        await f_callback(res)

    await db_session.commit()

  return True

