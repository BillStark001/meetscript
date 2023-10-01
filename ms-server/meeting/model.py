import asyncio
import os
import peewee as pw
import peewee_async as pwa
from datetime import datetime

from typing import Optional

from constants import Codes
from utils.sqlite import AsyncSqliteDatabase

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
  text = pw.TextField(default='')
  translate1 = pw.TextField(default='')
  translate2 = pw.TextField(default='')
  translate3 = pw.TextField(default='')
  translate4 = pw.TextField(default='')
  
  class Meta:
    database = db


async def add_record(session: str, time: datetime, text: str):
  try:
    await objects.create(
        MeetingRecord,
        session=session,
        time=time,
        text=text,
    )
  except pw.IntegrityError:
    return Codes.ERR_SESSION_DB


async def fetch_records(session: str, time_start: datetime, time_end: Optional[datetime] = None):
  where_clause = (MeetingRecord.session == session) & \
      (MeetingRecord.time >= time_start)
  if time_end is not None:
    where_clause = where_clause & (MeetingRecord.time <= time_end)
  results = await objects.execute(MeetingRecord.select().where(where_clause))
  return results
