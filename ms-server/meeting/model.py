import asyncio
import os
import peewee as pw
import peewee_async as pwa
from datetime import datetime, timezone
from dataclasses import dataclass

from typing import Optional, Callable, Iterable

from constants import Codes
from utils.sqlite import AsyncSqliteDatabase
from utils.object import format_time

db = AsyncSqliteDatabase(None)
objects = pwa.Manager(db)

_MEETING_SESSION_DIR = './meetings/'
os.makedirs(_MEETING_SESSION_DIR, exist_ok=True)


def initialize_db(target: str = 'default'):
  db.init(os.path.join(_MEETING_SESSION_DIR, target + '.sqlite'))
  db.set_allow_sync(False)
  with db.allow_sync():
    db.connect()
    db.create_tables([MeetingRecord], safe=True)
    db.close()


class MeetingRecord(pw.Model):
  session = pw.CharField(max_length=36, default='')
  time = pw.DateTimeField(default=datetime.utcfromtimestamp(0))
  lang = pw.CharField(max_length=8, default='')
  text = pw.TextField(default='')
  translate1 = pw.TextField(default='')
  translate2 = pw.TextField(default='')
  translate3 = pw.TextField(default='')
  translate4 = pw.TextField(default='')

  class Meta:
    database = db


_TRANSLATE_ORDER = {
    'en': (1, MeetingRecord.translate1),
    'jp': (2, MeetingRecord.translate2),
    'zh': (3, MeetingRecord.translate3),
}


async def add_record(
    session: str,
    time: datetime,
    text: str,
    lang: Optional[str] = None
):
  try:
    i, _ = _TRANSLATE_ORDER.get(lang, (-1, None))
    kwargs = {} if i < 0 else {f'translate{i}': text}
    await objects.create(
        MeetingRecord,
        session=session,
        time=time,
        text=text,
        lang=lang or '',
        **kwargs
    )
  except pw.IntegrityError:
    return Codes.ERR_SESSION_DB


async def fetch_records(
    session: str,
    time_start: datetime,
    time_end: Optional[datetime] = None,
    lang: Optional[str] = None,
):
  where_clause = (MeetingRecord.session == session) & \
      (MeetingRecord.time >= time_start)
  if time_end is not None:
    where_clause = where_clause & (MeetingRecord.time <= time_end)
  if lang is not None and lang != '':
    where_clause = where_clause & (MeetingRecord.lang.startswith(lang))
  results = await objects.execute(MeetingRecord.select().where(where_clause))
  return results

# translation related

@dataclass
class TranslationResult:
  start: int = 0
  text: str = ''
  lang: str = ''
  translated: str = ''

  def __str__(self) -> str:
    return f'[{self.lang},{format_time(datetime.utcfromtimestamp(self.start / 1000))}] {self.text} -> {self.translated}'


async def update_translations(
    f_translate: Callable[[str, str, str], asyncio.Task[str]],  # src, tgt, txt_src -> txt_tgt
    session_value: Optional[str],
    time_threshold: datetime,
    language: str,
    f_callback: Optional[Callable[[TranslationResult], asyncio.Task]] = None,
):
  lang_id, lang_key = _TRANSLATE_ORDER.get(language, (-1, None))
  if not lang_key:
    return False

  lang_objkey = f'translate{lang_id}'

  where_clause = (MeetingRecord.time > time_threshold) & (
      MeetingRecord.lang != language) & (lang_key == '')
  if session_value:
    where_clause = where_clause & (MeetingRecord.session == session_value)

  records: Iterable[MeetingRecord] = await objects.execute(MeetingRecord.select().where(where_clause))

  for record in records:
    translated_text = await f_translate(record.lang, language, record.text)
    setattr(record, lang_objkey, translated_text)
    if f_callback:
      ts = int(record.time.replace(tzinfo=timezone.utc).timestamp() * 1000)
      res = TranslationResult(ts, record.text, record.lang, translated_text)
      await f_callback(res)
    await objects.update(record)

  return True
