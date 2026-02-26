import { describe, it, expect, beforeEach } from 'vitest';

// Pure logic tests for the transcript state management
// (no React rendering needed)

type TranscriptionResult = {
  utt_id: number;
  seq_id: number;
  is_final: boolean;
  start: number;
  end: number;
  text: string;
  lang: string;
};

type CorrectionEvent = {
  type: 'correction';
  utt_id: number;
  original: string;
  replacement: string;
};

// Simulate the transcript map logic
function applyMessage(
  transcripts: Map<number, TranscriptionResult>,
  t: TranscriptionResult,
): Map<number, TranscriptionResult> {
  const next = new Map(transcripts);
  const existing = next.get(t.utt_id);
  if (!existing || t.seq_id > existing.seq_id) {
    next.set(t.utt_id, t);
  }
  return next;
}

function applyCorrection(
  transcripts: Map<number, TranscriptionResult>,
  evt: CorrectionEvent,
): Map<number, TranscriptionResult> {
  const entry = transcripts.get(evt.utt_id);
  if (!entry) return transcripts;
  const next = new Map(transcripts);
  next.set(evt.utt_id, { ...entry, text: entry.text.replace(evt.original, evt.replacement) });
  return next;
}

describe('transcript state management', () => {
  let transcripts: Map<number, TranscriptionResult>;

  const makeResult = (utt_id: number, seq_id: number, text: string, is_final = false): TranscriptionResult => ({
    utt_id, seq_id, is_final, start: utt_id * 1000, end: utt_id * 1000 + 500, text, lang: 'en',
  });

  beforeEach(() => {
    transcripts = new Map();
  });

  it('adds a new partial result', () => {
    transcripts = applyMessage(transcripts, makeResult(1, 1, 'hello'));
    expect(transcripts.size).toBe(1);
    expect(transcripts.get(1)?.text).toBe('hello');
  });

  it('replaces existing result with higher seq_id (progressive repair)', () => {
    transcripts = applyMessage(transcripts, makeResult(1, 1, 'hellp'));
    transcripts = applyMessage(transcripts, makeResult(1, 2, 'hello'));
    expect(transcripts.get(1)?.text).toBe('hello');
    expect(transcripts.get(1)?.seq_id).toBe(2);
  });

  it('ignores stale seq_id', () => {
    transcripts = applyMessage(transcripts, makeResult(1, 3, 'hello world'));
    transcripts = applyMessage(transcripts, makeResult(1, 1, 'old'));
    expect(transcripts.get(1)?.text).toBe('hello world');
  });

  it('keeps multiple utterances separate', () => {
    transcripts = applyMessage(transcripts, makeResult(1, 1, 'first', true));
    transcripts = applyMessage(transcripts, makeResult(2, 1, 'second'));
    expect(transcripts.size).toBe(2);
  });

  it('applies correction event', () => {
    transcripts = applyMessage(transcripts, makeResult(1, 2, 'Box Troll is great', true));
    transcripts = applyCorrection(transcripts, { type: 'correction', utt_id: 1, original: 'Box Troll', replacement: 'Voxtral' });
    expect(transcripts.get(1)?.text).toBe('Voxtral is great');
  });

  it('ignores correction for unknown utt_id', () => {
    transcripts = applyMessage(transcripts, makeResult(1, 1, 'hello', true));
    const prev = new Map(transcripts);
    transcripts = applyCorrection(transcripts, { type: 'correction', utt_id: 99, original: 'x', replacement: 'y' });
    expect(transcripts).toEqual(prev);
  });
});
