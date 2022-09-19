import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocal, saveLocal } from "../background/localStorage";
import { DEFAULT_LANGUAGE } from "../../config";
import { LANGUAGE_CONFIG } from "../constant/storageKey";
import en from "./en.json";
import zh from "./zh_CN.json";


export const LANG_SUPPORT_LIST = {
  "ZH_CN":"zh_CN",
  "EN":"en"
}

const resources = {
  en: {
    translation: {
      ...en,
    },
  },
  zh_CN: {
    translation: {
      ...zh,
    },
  },
};

export function changeLanguage(lan) {
  i18n.changeLanguage(lan);
  saveLocal(LANGUAGE_CONFIG, lan)
}

export function getCurrentLang() {
  return i18n.language
}
export const languageOption = [
  { key: LANG_SUPPORT_LIST.EN, value: 'English' },
  {key:LANG_SUPPORT_LIST.ZH_CN,value:"中文"},
]
export var default_language = DEFAULT_LANGUAGE

function checkIsZh(language){
  return browserLangParse(language) === LANG_SUPPORT_LIST.ZH_CN || browserLangParse(language) == "zh"
}

export function languageInit() {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: default_language,
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
    });

  let res = getLocal(LANGUAGE_CONFIG)
  if (res) {
    changeLanguage(res)
    default_language = res
  } else {
    const language = navigator.language || navigator.languages[0];
    res = checkIsZh(language) ? LANG_SUPPORT_LIST.ZH_CN : LANG_SUPPORT_LIST.EN;
    changeLanguage(res)
    default_language = res
    saveLocal(LANGUAGE_CONFIG, res)
  }
  return res
}
/**
 * parse browser lang  - to _
 * @param {*} lang 
 * @returns 
 */
function browserLangParse(lang){
  if(lang){
    return lang.replace("-","_")
  }else{
    return lang
  }
}

export function getLanguage(key,options) {
  return i18n.t(key,options)
}


languageInit()
