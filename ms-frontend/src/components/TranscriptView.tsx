import { atom, useAtom } from "jotai";
import { Tag, Wrap } from "@chakra-ui/react";

export type TranscriptionResult = {
  utt_id: number;
  seq_id: number;
  is_final: boolean;
  start: number;
  end: number;
  text: string;
  lang: string;
};

export type CorrectionEvent = {
  type: 'correction';
  utt_id: number;
  original: string;
  replacement: string;
};

// Map of utt_id -> latest result
const transcriptsAtom = atom<Map<number, TranscriptionResult>>(new Map());

const getTime = (d: Date) => {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const useTranscript = () => {
  const [transcripts, setTranscripts] = useAtom(transcriptsAtom);

  const onMessage = (t: TranscriptionResult) => {
    setTranscripts(prev => {
      const next = new Map(prev);
      const existing = next.get(t.utt_id);
      if (!existing || t.seq_id > existing.seq_id) {
        next.set(t.utt_id, t);
      }
      return next;
    });
  };

  const onCorrection = (evt: CorrectionEvent) => {
    setTranscripts(prev => {
      const entry = prev.get(evt.utt_id);
      if (!entry) return prev;
      const next = new Map(prev);
      next.set(evt.utt_id, {
        ...entry,
        text: entry.text.replace(evt.original, evt.replacement),
      });
      return next;
    });
  };

  const clear = () => setTranscripts(new Map());

  const history = Array.from(transcripts.values())
    .filter(t => t.is_final)
    .sort((a, b) => a.utt_id - b.utt_id);

  const incomplete = Array.from(transcripts.values())
    .filter(t => !t.is_final)
    .sort((a, b) => a.utt_id - b.utt_id);

  return { history, incomplete, onMessage, onCorrection, clear, transcripts };
};

type Props = {
  history?: TranscriptionResult[];
  incomplete?: TranscriptionResult[];
};

export const TranscriptView = (props: Props) => {
  const { history, incomplete } = props;
  return (
    <Wrap>
      {history?.map(x => (
        <Tag.Root key={`${x.utt_id}-final`}>
          <Tag.Label>{x.lang} / {getTime(new Date(x.start))} / {x.text}</Tag.Label>
        </Tag.Root>
      ))}
      {incomplete?.map(x => (
        <Tag.Root key={`${x.utt_id}-partial`} colorPalette="gray">
          <Tag.Label>{getTime(new Date(x.start))} / {x.text}</Tag.Label>
        </Tag.Root>
      ))}
      {(!history?.length && !incomplete?.length) && 'No Input'}
    </Wrap>
  );
};