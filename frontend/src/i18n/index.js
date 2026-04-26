import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en/common.json";
import ne from "./ne/common.json";

i18n.use(initReactI18next).init({
	resources: {
		en: { common: en },
		ne: { common: ne },
	},
	lng: localStorage.getItem("lang") || "en",
	fallbackLng: "en",
	defaultNS: "common",
	interpolation: { escapeValue: false },
});

export default i18n;
