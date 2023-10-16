import { TranscriptView, useTranscript } from "@/components/TranscriptView";


export const StandaloneTranscriptPage = () => {
  const t = useTranscript();

  return <TranscriptView {...t} />;
};

export default StandaloneTranscriptPage;