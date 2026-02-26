import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

_DB_URL = os.environ.get('DB_URL', 'sqlite+aiosqlite:///./meetscript.db')

engine = create_async_engine(_DB_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def init_db(base=None):
    if base is None:
        base = Base
    async with engine.begin() as conn:
        await conn.run_sync(base.metadata.create_all)
