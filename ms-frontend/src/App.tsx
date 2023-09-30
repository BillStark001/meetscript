import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { useTranslation } from 'react-i18next';

const fetchApiRoot = async () => {
  try {
    const res = await fetch('/api');
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
};

function App() {
  const [count, setCount] = useState(0);
  const [ret, setRet] = useState('[NONE]');
  const { t } = useTranslation();

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
      <h1>Vite + React</h1>
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
    </>
  );
}

export default App;
