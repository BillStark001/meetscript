import hashlib
import hmac
import re

from config import AppConfig

_pattern_username = r'^[a-zA-Z0-9_]{8,32}$'
_pattern_password = r'^[\x20-\x7E]{6,128}$'
_pattern_email = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


def is_valid_username(username: str):
  return re.match(_pattern_username, username) is not None


def is_valid_password(password: str):
  return re.match(_pattern_password, password) is not None


def is_valid_email(email: str):
  return re.match(_pattern_email, email) is not None


def encode_password(password: str):
  return hmac.new(AppConfig.HmacSalt, password, hashlib.sha256).hexdigest()


def verify_password(password: str, encoded: str):
  new_encoded = encode_password(password)
  return new_encoded == encoded
