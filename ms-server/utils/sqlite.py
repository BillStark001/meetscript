"""
Reference: https://gist.github.com/xsduan/09fb145da3da3a78f5ca844b155f27aa
Temporary module to allow for sqlite databases during development. Remove once
we get an actual database.
"""
import peewee
import aiosqlite
from peewee_async import AsyncDatabase
import functools


class AsyncSqliteConnection:
  def __init__(self, *, database=None, loop=None, timeout=None, **kwargs):
    self._created_connections = []
    self.loop = loop
    self.database = database
    self.timeout = timeout
    self.connect_params = kwargs

  async def acquire(self):
    conn = aiosqlite.connect(database=self.database, **self.connect_params)
    self._created_connections.append(conn)
    return await conn.__aenter__()

  async def release(self, conn):
    if conn in self._created_connections:
      self._created_connections.remove(conn)
    await conn.commit()
    await conn.__aexit__(None, None, None)

  async def connect(self):
    pass

  async def close(self):
    for conn in self._created_connections:
      await conn.__aexit__(None, None, None)
    self._created_connections = []

  async def cursor(self, conn=None, *args, **kwargs):
    in_transaction = conn is not None
    if not conn:
      conn = await self.acquire()
    cursor = await conn.cursor(*args, **kwargs)
    cursor.release = functools.partial(
        self.release_cursor,
        cursor, in_transaction=in_transaction
    )
    return cursor

  async def release_cursor(self, cursor, in_transaction=False):
    conn = cursor._conn
    await cursor.__aexit__(None, None, None)
    if not in_transaction:
      await self.release(conn)


class AsyncSqliteMixin(AsyncDatabase):

  def init_async(self, conn_class=AsyncSqliteConnection):
    self._async_conn_cls = conn_class

  @property
  def connect_params_async(self):
    return {**self.connect_params}

  async def last_insert_id_async(self, cursor):
    """Get ID of last inserted row.
    """
    return cursor.lastrowid


class AsyncSqliteDatabase(AsyncSqliteMixin, peewee.SqliteDatabase):
  def init(self, database, **kwargs):
    super().init(database, **kwargs)
    self.init_async()
