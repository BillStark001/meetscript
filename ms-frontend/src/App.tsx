import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { useTranslation } from 'react-i18next';
import { atom, useAtom } from 'jotai';
import { AudioDeviceScheme, getAudioDevices, initAudioDevice } from './sys/mic';

const fetchApiRoot = async () => {
  try {
    const res = await fetch('/api');
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
};

const requireWsToken = async () => {
  const res = await fetch('/api/meet/ws_request');
  const json = await res.json();
  return json.access_token;
};


const createWs = async (token: string, deviceId: string) => {
  let socket: WebSocket | undefined = undefined;

  const sender = (data: Blob) => {
    socket?.send(data);
  }
  const mediaRecorder = await initAudioDevice(deviceId, sender);

  socket = new WebSocket(`${
    location.protocol == 'https:' ? 'wss:' : 'ws:'
  }//${location.host.replace(':5173', ':8000')}/ws/meet/provide?token=${encodeURIComponent(token)}`);

  socket.onopen = function () {
    console.log('opened');
  };

  let iv: NodeJS.Timeout | undefined = undefined;
  
  socket.onmessage = function (event) {
    let eventData: Record<string, unknown> | undefined = undefined;
    try {
      eventData = JSON.parse(event.data);
    } catch (e) {
      eventData = undefined;
    }
    console.log('message', eventData || event.data);
    if (eventData?.['code'] === 0) {
      mediaRecorder.start();
      console.log('start');
      iv = setInterval(() => {
        mediaRecorder.stop();
        mediaRecorder.start();
      }, 200);
    }
  };
  
  socket.onerror = function (error) {
    console.error(error);
  };
  
  socket.onclose = function (event) {
    console.log('closed', event.code, event.reason);
    // clearInterval(iv);
    mediaRecorder.stop();
  };
  
  
  return [socket, mediaRecorder];
};

const audioAtom = atom<AudioDeviceScheme[]>([]);

function App() {
  const [count, setCount] = useState(0);
  const [ret, setRet] = useState('[NONE]');
  const { t } = useTranslation();

  const [token, setToken] = useState('');
  const [audioDevices, setAudioDevices] = useAtom(audioAtom);
  const [aid, setAid] = useState('');

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
            <option value={''} selected={aid == ''}>[SELECT]</option>
            {audioDevices.map(({ value, text }) => <option value={value} selected={aid == value}>{text}</option>)}
          </select>
        </p>
        <p>
          <button onClick={tryGetToken}>{t('tryGetToken')}</button>
          <button onClick={() => getAudioDevices().then(setAudioDevices)}>{t('tryGetAudioDevices')}</button>
          <button onClick={() => {
            createWs(token, aid);
          }}>{t('connect')}</button>
        </p>
      </div>
    </>
  );
}

export default App;
