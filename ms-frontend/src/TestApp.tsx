import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { atom, useAtom } from 'jotai';
import { AudioDeviceScheme, getAudioDevices } from './sys/mic';
import { MeetingSocketHandler, requireWsToken, useTranscriptorWs } from './api/meeting';
import { fetchApiRoot } from './api';
import { TranscriptView, useTranscript } from './components/TranscriptView';
import { Button, Select, Textarea } from '@chakra-ui/react';


const audioAtom = atom<AudioDeviceScheme[]>([]);



const TestApp = () => {
  const [count, setCount] = useState(0);

  const [ret, setRet] = useState('[NONE]');
  const [token, setToken] = useState('');
  const [audioDevices, setAudioDevices] = useAtom(audioAtom);
  const [aid, setAid] = useState('');

  const { t } = useTranslation();

  const { history, incomplete, onMessage, clear } = useTranscript();
  const handler: MeetingSocketHandler = {
    onStart(_, data) {
      console.log('started', data);
    },
    onStop(eventIn) {
      const event = eventIn as CloseEvent;
      console.log('stopped', event.code, event.reason);
      clear();
    },
    onMessage(_, data) {
      if (data.text === 'Thank you.' || data.text === ' Thank you.')
        return;
      onMessage(data);
    },
  }
  const { start, stop } = useTranscriptorWs(token, aid, handler);


  const tryGetToken = async () => {
    const mightBeToken = await requireWsToken();
    if (mightBeToken)
      setToken(mightBeToken);
    else
      setRet('[FAILED]');
  };

  return (
    <>
      <div className="card">
        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
        <Button onClick={async () => {
          setRet(JSON.stringify(await fetchApiRoot()));
        }}>
          Fetch
        </Button>
        <p>
          API Entry Return: <code>{ret}</code>
        </p>
      </div>
      <p className="read-the-docs">
        I18n test: {t('test')}
      </p>
      <div className="card">
        <p>
          <Textarea rows={5} value={token} onChange={(e) => setToken(e.target.value)} />
        </p>
        <p>
          <Select value={aid} onChange={(e) => setAid(e.target.value)}>
            <option value={''}>[SELECT]</option>
            {audioDevices.map(({ value, text }) => <option value={value} key={value + text}>{text}</option>)}
          </Select>
        </p>
        <p>
          <Button onClick={tryGetToken}>{t('tryGetToken')}</Button>
          <Button onClick={() => getAudioDevices().then(setAudioDevices)}>{t('tryGetAudioDevices')}</Button>
          <Button onClick={() => {
            start();
          }}>{t('connect')}</Button>
          <Button onClick={() => {
            stop();
          }}>{t('disconnect')}</Button>
        </p>
      </div>
      <TranscriptView history={history} incomplete={incomplete} />
    </>
  )
}

export default TestApp;
