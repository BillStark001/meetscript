import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { ChakraProvider, ColorModeScript, ThemeConfig, extendTheme } from '@chakra-ui/react';

// i18n

import enJson from './locale/en.json?raw';
import jaJson from './locale/en.json?raw';
import zhJson from './locale/en.json?raw';

const resources = {
  en: JSON.parse(enJson),
  ja: JSON.parse(jaJson),
  zh: JSON.parse(zhJson),
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
});

// theme

const themeConfig: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const theme = extendTheme({ config: themeConfig });

// dom root

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
