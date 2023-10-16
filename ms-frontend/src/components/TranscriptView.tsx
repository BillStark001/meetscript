import { atom, useAtom } from "jotai";
import { TranscriptionResult } from "@/api/meeting";
import { Tag, Wrap } from "@chakra-ui/react";

const historyTranscriptsAtom = atom<TranscriptionResult[]>([]);
const incompleteTranscriptAtom = atom<TranscriptionResult | undefined>(undefined);

const getTime = (d: Date) => {
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  const timeString = `${hours}:${minutes}:${seconds}`;
  return timeString;
}

export const useTranscript = () => {
  const [tHist, setHist] = useAtom(historyTranscriptsAtom);
  const [tIcmp, setIcmp] = useAtom(incompleteTranscriptAtom);

  const onMessage = (t: TranscriptionResult) => {
    if (t.partial) {
      setIcmp(t);
    } else {
      setHist(tHist => [...tHist, t]);
      if (tIcmp && (t.start >= tIcmp.start)) {
        setIcmp(undefined);
      }
    }
  };

  const clear = () => {
    setHist([]);
    setIcmp(undefined);
  };

  return {
    history: tHist,
    incomplete: tIcmp,
    onMessage,
    clear,
  };
}

type Props = {
  history?: TranscriptionResult[],
  incomplete?: TranscriptionResult,
}

export const TranscriptView = (props: Props) => {
  const { history, incomplete } = props;
  return <Wrap>
    { history?.map(x => <Tag key={`${x.start}-${x.end}-${x.lang.substring(8)}`}>
      <span>{x.lang} / {getTime(new Date(x.start))} / {x.text}</span>
    </Tag>) }
    { incomplete && <Tag bgColor='gray.400'>
      {getTime(new Date(incomplete.start))} / {incomplete.text}
    </Tag> }
    { (!history && !incomplete) && 'No Input' }
  </Wrap>
};