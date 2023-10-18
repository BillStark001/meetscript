import { useTranscriptionReceiverWs } from "@/api/meeting";
import { TranscriptView, useTranscript } from "@/components/TranscriptView";


export const StandaloneTranscriptPage = () => {
  const t = useTranscript();

  useTranscriptionReceiverWs();

  return <>
    { '114514 '}
    <TranscriptView {...t} />
  </>;
};

export default StandaloneTranscriptPage;