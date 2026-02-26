"""
Tests for the streaming stability / utterance tracking module.
These tests are decoupled from the Whisper model and database.
"""
import pytest
from meeting.stability import UttTracker, UtteranceEvent, CorrectionEvent


def make_evt(tracker: UttTracker, start: int, text: str, lang: str = 'en', end: int = 0, is_final: bool = False) -> UtteranceEvent:
    return tracker.assign(start=start, text=text, lang=lang, end=end or start + 500, is_final=is_final)


class TestUttTracker:

    def test_first_call_starts_utterance_1(self):
        tracker = UttTracker()
        evt = make_evt(tracker, start=1000, text='hello')
        assert evt.utt_id == 1
        assert evt.seq_id == 1

    def test_partial_increments_seq_id(self):
        tracker = UttTracker()
        e1 = make_evt(tracker, 1000, 'hell')
        e2 = make_evt(tracker, 1000, 'hello')
        assert e1.utt_id == e2.utt_id
        assert e2.seq_id == e1.seq_id + 1

    def test_final_result_advances_utterance(self):
        tracker = UttTracker()
        e1 = make_evt(tracker, 1000, 'hello world', is_final=True)
        e2 = make_evt(tracker, 2000, 'next sentence')
        assert e2.utt_id == e1.utt_id + 1
        assert e2.seq_id == 1

    def test_large_gap_advances_utterance(self):
        tracker = UttTracker()
        e1 = make_evt(tracker, 0, 'first')
        # 31 seconds later — should start a new utterance
        e2 = make_evt(tracker, 31_000, 'second')
        assert e2.utt_id == e1.utt_id + 1

    def test_small_gap_keeps_utterance(self):
        tracker = UttTracker()
        e1 = make_evt(tracker, 0, 'partial')
        e2 = make_evt(tracker, 1_000, 'partial more')
        assert e1.utt_id == e2.utt_id

    def test_is_final_flag(self):
        tracker = UttTracker()
        partial = make_evt(tracker, 1000, 'text', is_final=False)
        assert partial.is_final is False
        tracker2 = UttTracker()
        final = make_evt(tracker2, 1000, 'text', is_final=True)
        assert final.is_final is True

    def test_utt_id_monotonically_increases(self):
        tracker = UttTracker()
        ids = []
        for i in range(5):
            e = make_evt(tracker, i * 1000, f'utt {i}', is_final=True)
            ids.append(e.utt_id)
        assert ids == sorted(ids)
        assert len(set(ids)) == 5

    def test_make_correction_event(self):
        tracker = UttTracker()
        evt = make_evt(tracker, 1000, 'Box Troll', is_final=True)
        corr: CorrectionEvent = tracker.make_correction(evt.utt_id, 'Box Troll', 'Voxtral')
        assert corr.utt_id == evt.utt_id
        assert corr.original == 'Box Troll'
        assert corr.replacement == 'Voxtral'
        assert corr.type == 'correction'


class TestUtteranceEventFields:

    def test_event_carries_all_fields(self):
        tracker = UttTracker()
        evt = tracker.assign(start=5000, text='test text', lang='zh', end=5500, is_final=False)
        assert evt.text == 'test text'
        assert evt.lang == 'zh'
        assert evt.start == 5000
        assert evt.end == 5500
        assert evt.is_final is False
        assert evt.type == 'transcription'

    def test_correction_event_type_field(self):
        tracker = UttTracker()
        corr = tracker.make_correction(1, 'original', 'replacement')
        assert corr.type == 'correction'
