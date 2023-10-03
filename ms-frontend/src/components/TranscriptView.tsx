import { atom, useAtom } from "jotai";
import { TranscriptionResult } from "../api/meeting";


const historyTranscriptsAtom = atom<TranscriptionResult[]>([]);
const incompleteTranscriptAtom = atom<TranscriptionResult | undefined>(undefined);


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
