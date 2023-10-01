import peewee as pw
from datetime import datetime
import pytz

from constants import Codes
import user.format as f
from constants import UserGroup

from typing import Optional

# database

db_users = pw.SqliteDatabase('./users.sqlite')
def initialize_db():
  db_users.connect()
  db_users.create_tables([User], safe = True)
  db_users.close()

class User(pw.Model):

  email = pw.CharField(unique=True, max_length=32)
  pw_hash = pw.CharField(max_length=128)
  pw_update = pw.DateTimeField(default=datetime.utcfromtimestamp(0))

  username = pw.CharField(max_length=32)
  group=pw.CharField(max_length=64)
  

  class Meta:
    database = db_users

  def set_username(self, username: str, save=True):
    if not f.is_valid_username(username):
      return Codes.ERR_INVALID_USERNAME
    self.username = username
    if save:
      self.save()
    return Codes.DONE

  def set_password(self, password: str, save=True):
    if not f.is_valid_password(password):
      return Codes.ERR_INVALID_PASSWORD
    self.pw_hash = f.encode_password(password)
    self.pw_update = datetime.utcnow()
    if save:
      self.save()
    return Codes.DONE


def create_user(email: str, username: str, password: str, group: str = UserGroup.User):

  if not f.is_valid_email(email):
    return Codes.ERR_INVALID_EMAIL
  if not f.is_valid_username(username):
    return Codes.ERR_INVALID_USERNAME
  if not f.is_valid_password(password):
    return Codes.ERR_INVALID_PASSWORD

  pw_hash = f.encode_password(password)

  try:
    User.create(
      email=email, 
      username=username, 
      pw_hash=pw_hash, 
      pw_update=datetime.utcnow(),
      group=group
    )
    return Codes.DONE
  except pw.IntegrityError as e:
    return Codes.ERR_EXISTENT_EMAIL


def authenticate_user(email: str, password: str):
  try:
    user = User.get(User.email == email)
    if f.verify_password(password, user.pw_hash):
      return Codes.DONE, user
    else:
      return Codes.ERR_WRONG_UNAME_OR_PW, None
  except User.DoesNotExist:
    return Codes.ERR_WRONG_UNAME_OR_PW, None


def get_user(email: str) -> Optional[User]:
  try:
    user = User.get(User.email == email)
    return user
  except User.DoesNotExist:
    return None

initialize_db()