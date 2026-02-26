"""
Pytest configuration for ms-server tests.
Pre-stubs heavy packages so that the meeting.stability module can be imported
in isolation without requiring fastapi, sqlalchemy, jose, torch, etc.
"""
import sys
import os
import types
from unittest.mock import MagicMock

# Ensure the ms-server directory is on sys.path so that package-level imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Pre-stub the `meeting` package so that meeting/__init__.py (the FastAPI
# route module with many heavy dependencies) is never executed.
# Python will still be able to import meeting.stability from disk.
_meeting_stub = types.ModuleType('meeting')
_meeting_stub.__path__ = [os.path.join(os.path.dirname(os.path.dirname(__file__)), 'meeting')]
_meeting_stub.__package__ = 'meeting'
sys.modules.setdefault('meeting', _meeting_stub)

# Similarly stub `user` so user/__init__.py's side-effectful initialize_db()
# call and FastAPI route registrations are skipped.
_user_stub = types.ModuleType('user')
_user_stub.__path__ = [os.path.join(os.path.dirname(os.path.dirname(__file__)), 'user')]
_user_stub.__package__ = 'user'
sys.modules.setdefault('user', _user_stub)

# Mock remaining heavy optional packages
_MOCKED = [
    'fastapi',
    'fastapi.responses',
    'fastapi.staticfiles',
    'fastapi.security',
    'fastapi.logger',
    'starlette',
    'starlette.websockets',
    'starlette.responses',
    'jose',
    'torch',
    'whisper',
    'numpy',
    'numpy.typing',
    'aiohttp',
    'pydantic_yaml',
    'uvicorn',
    'websockets',
    'dataclasses_json',
]

for _mod in _MOCKED:
    sys.modules.setdefault(_mod, MagicMock())
