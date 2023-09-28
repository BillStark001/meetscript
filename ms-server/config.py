import os
from dotenv import load_dotenv

load_dotenv()

def _i(data):
  ret = -1
  try:
    ret = int(data)
  except:
    pass
  if ret < 1:
    ret = 1
  return ret

class AppConfig:
  
  _JWT_SECRET_KEY = os.environ.get('SECRET_KEY') or 'SECRET_KEY'
  _JWT_EXPIRE_MINUTES = _i(os.environ.get('JWT_EXPIRE_MINUTES'))
  
  _HMAC_SALT = os.environ.get('HMAC_SALT') or 'HMAC_SALT'
  

  @classmethod
  @property
  def JwtSecretKey(cls):
    return cls._JWT_SECRET_KEY
  
  @classmethod
  @property
  def JwtExpireMinutes(cls):
    return cls._JWT_EXPIRE_MINUTES

  @classmethod
  @property
  def HmacSalt(cls):
    return cls._HMAC_SALT
