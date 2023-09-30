import i18n from "i18next";
import { initReactI18next } from "react-i18next";

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