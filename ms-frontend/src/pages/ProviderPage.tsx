import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { atom, useAtom } from 'jotai';
import { AudioDeviceScheme, getAudioDevices } from '../sys/mic';
import { requireWsToken, useTranscriptorWs } from '../api/meeting';
import { Button, Grid, Select, Textarea, Wrap } from '@chakra-ui/react';
import { openSmallWindow } from '@/utils/dom';


const audioAtom = atom<AudioDeviceScheme[]>([]);



const ProviderPage = () => {

  const [token, setToken] = useState('');
  const [audioDevices, setAudioDevices] = useAtom(audioAtom);
  const [aid, setAid] = useState('');

  const { t } = useTranslation();

  const { start, stop } = useTranscriptorWs(token, aid);


  const tryGetToken = async () => {
    const mightBeToken = await requireWsToken(true);
    if (mightBeToken)
      setToken(mightBeToken);
    else
      setToken('[FAILED]');
  };

  const tryRefreshAudioDevice = async () => {
    const d = await getAudioDevices();
    setAudioDevices(d);
  };

  useEffect(() => {
    tryRefreshAudioDevice().then(tryGetToken);
  }, []);

  return (
    <>
      <Grid>
        <Textarea rows={5} value={token} onChange={(e) => setToken(e.target.value)} />
        <Select value={aid} onChange={(e) => setAid(e.target.value)}>
          <option value={''}>[SELECT]</option>
          {audioDevices.map(({ value, text }) => <option value={value} key={value + text}>{text}</option>)}
        </Select>
      </Grid>
      <Wrap>
        <Button onClick={tryGetToken}>{t('tryGetToken')}</Button>
        <Button onClick={tryRefreshAudioDevice}>{t('tryGetAudioDevices')}</Button>
        <Button onClick={() => {
          start();
        }}>{t('connect')}</Button>
        <Button onClick={() => {
          stop();
        }}>{t('disconnect')}</Button>
        <Button onClick={() => openSmallWindow('/#/w/t')}>{t('openSmallWindow')}</Button>
      </Wrap>
    </>
  )
}

export default ProviderPage;
