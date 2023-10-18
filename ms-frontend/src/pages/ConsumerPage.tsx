import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { requireWsToken, useTranscriptionBroadcasterWs } from '../api/meeting';
import { Button, Grid, Textarea, Wrap } from '@chakra-ui/react';
import { openSmallWindow } from '@/utils/dom';
import { TranscriptView, useTranscript } from '@/components/TranscriptView';


const ProviderPage = () => {

  const [token, setToken] = useState('');

  const { t } = useTranslation();
  const tr = useTranscript();

  const { start, stop } = useTranscriptionBroadcasterWs(token);
  const tryGetToken = async () => {
    const mightBeToken = await requireWsToken(false);
    if (mightBeToken)
      setToken(mightBeToken);
    else
      setToken('[FAILED]');
  };

  useEffect(() => {
    tryGetToken();
  }, []);

  return (
    <>
      <Grid>
        <Textarea rows={5} value={token} onChange={(e) => setToken(e.target.value)} />
      </Grid>
      <Wrap>
        <Button onClick={tryGetToken}>{t('tryGetToken')}</Button>
        <Button onClick={() => {
          start();
        }}>{t('connect')}</Button>
        <Button onClick={() => {
          stop();
        }}>{t('disconnect')}</Button>
        <Button onClick={() => openSmallWindow('/#/w/t')}>{t('openSmallWindow')}</Button>
      </Wrap>
      <TranscriptView {...tr} />
    </>
  )
}

export default ProviderPage;
