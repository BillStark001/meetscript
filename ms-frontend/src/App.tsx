import { Fragment, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { useTranslation } from 'react-i18next';
import { atom, useAtom } from 'jotai';
import { AudioDeviceScheme, getAudioDevices } from './sys/mic';
import { MeetingSocketHandler, createWs, requireWsToken, useTranscriptorWs } from './api/meeting';
import { fetchApiRoot } from './api';
import { useTranscript } from './components/TranscriptView';


const audioAtom = atom<AudioDeviceScheme[]>([]);

const getTime = (d: Date) => {
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  const timeString = `${hours}:${minutes}:${seconds}`;
  return timeString;
}

function App() {
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
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={async () => {
          setRet(JSON.stringify(await fetchApiRoot()));
        }}>
          Fetch
        </button>
        <p>
          API Entry Return: <code>{ret}</code>
        </p>
      </div>
      <p className="read-the-docs">
        I18n test: {t('test')}
      </p>
      <div className="card">
        <p>
          <textarea rows={5} value={token} onChange={(e) => setToken(e.target.value)} />
        </p>
        <p>
          <select value={aid} onChange={(e) => setAid(e.target.value)}>
            <option value={''}>[SELECT]</option>
            {audioDevices.map(({ value, text }) => <option value={value} key={value}>{text}</option>)}
          </select>
        </p>
        <p>
          <button onClick={tryGetToken}>{t('tryGetToken')}</button>
          <button onClick={() => getAudioDevices().then(setAudioDevices)}>{t('tryGetAudioDevices')}</button>
          <button onClick={() => {
            start();
          }}>{t('connect')}</button>
          <button onClick={() => {
            stop();
          }}>{t('disconnect')}</button>
        </p>
      </div>
      <div className="card">
        { history.map(x => <Fragment key={`${x.start}-${x.end}-${x.lang.substring(8)}`}>
          <span>{x.lang} / {getTime(new Date(x.start))} / {x.text}</span><br/>
        </Fragment>) }
        { incomplete && <span>{incomplete.text}</span> }
      </div>
    </>
  );
}

export default App;
