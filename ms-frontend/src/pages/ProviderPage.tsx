import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { atom, useAtom } from 'jotai';
import { AudioDeviceScheme, getAudioDevices } from '../sys/mic';
import { requireWsToken, useTranscriptorWs } from '../api/meeting';
import { Button, Grid, NativeSelect, Textarea, Wrap } from '@chakra-ui/react';
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
    setToken(mightBeToken ?? '[FAILED]');
  };

  const tryRefreshAudioDevice = async () => {
    setAudioDevices(await getAudioDevices());
  };

  useEffect(() => {
    tryRefreshAudioDevice().then(tryGetToken);
  }, []);

  return (
    <>
      <Grid>
        <Textarea rows={5} value={token} onChange={(e) => setToken(e.target.value)} />
        <NativeSelect.Root>
          <NativeSelect.Field value={aid} onChange={(e) => setAid(e.target.value)}>
            <option value="">[SELECT]</option>
            {audioDevices.map(({ value, text }) => (
              <option value={value} key={value + text}>{text}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Grid>
      <Wrap>
        <Button onClick={tryGetToken}>{t('tryGetToken')}</Button>
        <Button onClick={tryRefreshAudioDevice}>{t('tryGetAudioDevices')}</Button>
        <Button onClick={() => start()}>{t('connect')}</Button>
        <Button onClick={() => stop()}>{t('disconnect')}</Button>
        <Button onClick={() => openSmallWindow('/#/w/t')}>{t('openSmallWindow')}</Button>
      </Wrap>
    </>
  );
};

export default ProviderPage;
