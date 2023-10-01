import os
from utils.data import parse_timedelta
from dotenv import load_dotenv

load_dotenv()

class AppConfig:
  
  _JWT_SECRET_KEY = os.environ.get('SECRET_KEY') or 'SECRET_KEY'
  _ACCESS_TOKEN_EXPIRES = parse_timedelta(os.environ.get('ACCESS_TOKEN_EXPIRES') or '5min')
  _REFRESH_TOKEN_EXPIRES = parse_timedelta(os.environ.get('REFRESH_TOKEN_EXPIRES') or '180d')
  
  _HMAC_SALT = (os.environ.get('HMAC_SALT') or 'HMAC_SALT').encode()
  

  @classmethod
  @property
  def JwtSecretKey(cls):
    return cls._JWT_SECRET_KEY
  
  @classmethod
  @property
  def AccessTokenExpires(cls):
    return cls._ACCESS_TOKEN_EXPIRES
  
  @classmethod
  @property
  def RefreshTokenExpires(cls):
    return cls._REFRESH_TOKEN_EXPIRES

  @classmethod
  @property
  def HmacSalt(cls):
    return cls._HMAC_SALT
