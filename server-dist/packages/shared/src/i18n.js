"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localizedDateFormatters = exports.resolveLocale = exports.isLocale = exports.LOCALE_STORAGE_KEY = exports.BUSINESS_TIMEZONE = exports.DEFAULT_LOCALE = void 0;
const domain_1 = require("./domain");
exports.DEFAULT_LOCALE = 'hr';
exports.BUSINESS_TIMEZONE = 'Europe/Zagreb';
exports.LOCALE_STORAGE_KEY = 'nautica-locale';
const isLocale = (value) => domain_1.locales.includes(value);
exports.isLocale = isLocale;
const resolveLocale = (value) => value && (0, exports.isLocale)(value) ? value : exports.DEFAULT_LOCALE;
exports.resolveLocale = resolveLocale;
exports.localizedDateFormatters = {
    hr: 'hr-HR',
    en: 'en-GB',
};
