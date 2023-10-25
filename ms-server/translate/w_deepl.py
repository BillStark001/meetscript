from typing import Optional

import asyncio
import aiohttp
import re
import urllib.parse
import logging

from translate.worker import TranslateWorker

default_logger = logging.getLogger(__name__)

# Reference: https://github.com/seratch/deepl-for-slack/blob/master/src/deepl.ts
class DeepLWorker(TranslateWorker):

  def __init__(
      self,
      auth_key: str,
      using_free_plan: bool,
      logger: Optional[logging.Logger] = None,
  ):
    self.auth_key = auth_key
    self.logger = logger or default_logger
    api_subdomain = "api-free" if using_free_plan else "api"
    self.base_url = f"https://{api_subdomain}.deepl.com"

  async def translate(self, text: str, target_language: str):
    data = {
        "auth_key": self.auth_key,
        "text": prepare_text(text),
        "target_lang": target_language.upper(),
        "tag_handling": "xml",
        "ignore_tags": "emoji,mrkdwn,ignore",
    }

    headers = {"content-type": "application/x-www-form-urlencoded;charset=utf-8"}
    data_encoded = aiohttp.FormData(data)

    response_data = None
    response_error = None
    async with aiohttp.ClientSession() as session:
      async with session.post(
          urllib.parse.urljoin(self.base_url, "/v2/translate"),
          data=data_encoded,
          headers=headers
      ) as response:
        try:
          response_data = await response.json()
        except Exception as e:
          response_error = e

    if response_data is not None and \
        "translations" in response_data and \
            len(response_data["translations"]) > 0:
      translated_text = response_data["translations"][0]["text"]
      return restore_text(translated_text)
    else:
      return ":x: Failed to translate it due to an unexpected response from DeepL API"


def replace_special_syntax(match_text: str):

  if match_text.startswith(("#", "@")):
    return f"<mrkdwn>{match_text}</mrkdwn>"
  elif match_text.startswith("!subteam"):
    return "@[subteam mention removed]"
  elif match_text.startswith("!date"):
    return f"<mrkdwn>{match_text}</mrkdwn>"
  elif match_text.startswith("!"):
    match_parts = re.match(r"!(.*?)(?:\|.*)?", match_text)
    if match_parts:
      return f"<ignore>@{match_parts.group(1)}</ignore>"
    else:
      return "<ignore>@[special mention]</ignore>"
  elif "|" in match_text:
    link_parts = match_text.split("|")
    return f'<a href="{link_parts[0]}">{link_parts[1]}</a>'
  else:
    return f"<mrkdwn>{match_text}</mrkdwn>"


def prepare_text(text: str):
  return re.sub(r"<(.*?)>", lambda x: replace_special_syntax(x.group(0)), text)


def restore_text(text: str):
  text = re.sub(r"<emoji>([a-z0-9_-]+)</emoji>", r":\1:", text)
  text = re.sub(r"<mrkdwn>(.*?)</mrkdwn>", r"<\1>", text)
  text = re.sub(r'<a href="(.*?)">(.*?)</a>', r'<\1|\2>', text)
  text = re.sub(r"<ignore>(.*?)</ignore>", r"\1", text)
  return text
