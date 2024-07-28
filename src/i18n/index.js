import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { extGetLocal, extSaveLocal } from "../background/extensionStorage";
import { DEFAULT_LANGUAGE } from "../constant";
import { LANGUAGE_CONFIG } from "../constant/storageKey";

/**
 * 1. add language import
 */
import en from "./en.json";
import zh from "./zh_CN.json";
import tr from "./tr.json";
import uk from "./uk.json";
import ru from "./ru.json";

/**
 * 2. add language code to support list
 */
export const LANG_SUPPORT_LIST = {
  zh_CN: "zh_CN",
  zh: "zh",

  en: "en",
  tr: "tr",
  uk: "uk",
  ru:"ru"
};

/**
 * 3. add language config
 */
export const languageOption = [
  { key: LANG_SUPPORT_LIST.en, value: "English" },
  { key: LANG_SUPPORT_LIST.zh_CN, value: "中文" },
  { key: LANG_SUPPORT_LIST.tr, value: "Türkçe" },
  { key: LANG_SUPPORT_LIST.uk, value: "Українська мова" },
  { key: LANG_SUPPORT_LIST.ru, value: "Русский" },
];

/**
 * 4. add language resources
 * @returns
 */
function getResources() {
  const resources = {
    [LANG_SUPPORT_LIST.en]: {
      translation: en,
    },
    [LANG_SUPPORT_LIST.zh_CN]: {
      translation: zh,
    },
    [LANG_SUPPORT_LIST.tr]: {
      translation: tr,
    },
    [LANG_SUPPORT_LIST.uk]: {
      translation: uk,
    },
    [LANG_SUPPORT_LIST.ru]: {
      translation: ru,
    },
  };
  return resources;
}

export async function changeLanguage(lan) {
  i18n.changeLanguage(lan);
  await extSaveLocal(LANGUAGE_CONFIG, lan);
}

/**
 * parse browser lang  - to _
 * @param {*} lang
 * @returns
 */
function browserLangParse(lang) {
  if (lang) {
    return lang.replace("-", "_");
  } else {
    return lang;
  }
}

function checkIsZh(language) {
  let readableLang = browserLangParse(language);
  return (
    readableLang === LANG_SUPPORT_LIST.zh_CN ||
    readableLang === LANG_SUPPORT_LIST.zh
  );
}

let default_language = DEFAULT_LANGUAGE;

function isSupportLang(lang) {
  let supportList = Object.values(LANG_SUPPORT_LIST);
  let index = supportList.indexOf(lang);
  return index !== -1;
}

function getNextLang() {
  const language = navigator.language || navigator.languages[0];
  let readableLang = browserLangParse(language);
  let nextLang = readableLang;
  if (!isSupportLang(readableLang)) {
    nextLang = LANG_SUPPORT_LIST.en;
  } else {
    if (checkIsZh(language)) {
      nextLang = LANG_SUPPORT_LIST.zh_CN;
    }
  }
  return nextLang;
}

export async function languageInit() {
  const fallbackLng = "en";
  const resources = getResources();
  await i18n.use(initReactI18next).init({
    resources,
    lng: default_language,
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    fallbackLng,
  });

  let res = await extGetLocal(LANGUAGE_CONFIG);
  if (res) {
    changeLanguage(res);
    default_language = res;
  } else {
    res = getNextLang();
    changeLanguage(res);
    default_language = res;
    await extSaveLocal(LANGUAGE_CONFIG, res);
  }
  return res;
}

languageInit();
