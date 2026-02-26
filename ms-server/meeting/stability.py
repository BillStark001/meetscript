"""
Streaming stability: utterance tracking and progressive repair protocol.

Each utterance gets a unique utt_id.  Within an utterance, each new partial
result increments seq_id.  Clients that receive a message with (utt_id,
seq_id) should replace any previously displayed content for that utt_id.

Correction events (type='correction') can be sent after is_final=True to
apply LLM-based post-corrections to historical utterances.
"""
from dataclasses import dataclass, field
from typing import Optional
import threading


@dataclass
class UtteranceEvent:
  utt_id: int
  seq_id: int
  text: str
  lang: str
  start: int
  end: int
  is_final: bool
  # 'transcription' | 'correction'
  type: str = 'transcription'


@dataclass
class CorrectionEvent:
  utt_id: int
  original: str
  replacement: str
  type: str = 'correction'


class UttTracker:
  """
  Maps TranscriptionResult objects to (utt_id, seq_id) pairs.

  A new utterance is started whenever a final result is committed.
  Partial results increment seq_id within the current utterance.
  """

  def __init__(self):
    self._lock = threading.Lock()
    self._utt_id: int = 0
    self._seq_id: int = 0
    # track the start time of the current utterance to detect utterance breaks
    self._current_start: Optional[int] = None

  def _next_utterance(self) -> None:
    self._utt_id += 1
    self._seq_id = 0
    self._current_start = None

  def assign(self, start: int, text: str, lang: str, end: int, is_final: bool) -> UtteranceEvent:
    with self._lock:
      # detect a new utterance by a large gap or first call
      if self._current_start is None:
        self._current_start = start
        self._utt_id += 1
        self._seq_id = 0
      elif start > self._current_start + 30_000:
        # gap > 30 s → treat as new utterance
        self._utt_id += 1
        self._seq_id = 0
        self._current_start = start

      self._seq_id += 1
      evt = UtteranceEvent(
          utt_id=self._utt_id,
          seq_id=self._seq_id,
          text=text,
          lang=lang,
          start=start,
          end=end,
          is_final=is_final,
      )
      if is_final:
        # prepare for the next utterance
        self._current_start = None
      return evt

  def make_correction(self, utt_id: int, original: str, replacement: str) -> CorrectionEvent:
    return CorrectionEvent(utt_id=utt_id, original=original, replacement=replacement)
