"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareTime = exports.isPastBusinessSlot = exports.getBusinessWeekday = exports.currentBusinessTime = exports.toBusinessDate = exports.formatBusinessDate = exports.nowIso = exports.businessTimeZone = void 0;
const src_1 = require("../../../../packages/shared/src");
exports.businessTimeZone = src_1.BUSINESS_TIMEZONE;
const nowIso = () => new Date().toISOString();
exports.nowIso = nowIso;
const formatBusinessDate = (date, locale = src_1.DEFAULT_LOCALE) => new Intl.DateTimeFormat(src_1.localizedDateFormatters[locale], {
    timeZone: exports.businessTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
})
    .formatToParts(date)
    .reduce((acc, part) => {
    if (part.type !== 'literal')
        acc[part.type] = part.value;
    return acc;
}, {});
exports.formatBusinessDate = formatBusinessDate;
const toBusinessDate = (date) => {
    const parts = (0, exports.formatBusinessDate)(date);
    return `${parts.year}-${parts.month}-${parts.day}`;
};
exports.toBusinessDate = toBusinessDate;
const currentBusinessTime = () => new Intl.DateTimeFormat('en-GB', {
    timeZone: exports.businessTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
}).format(new Date());
exports.currentBusinessTime = currentBusinessTime;
const getBusinessWeekday = (date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Intl.DateTimeFormat('en-US', {
    timeZone: exports.businessTimeZone,
    weekday: 'short',
}).format(date));
exports.getBusinessWeekday = getBusinessWeekday;
const isPastBusinessSlot = (date, time) => {
    const now = new Date();
    const today = (0, exports.toBusinessDate)(now);
    const currentTime = (0, exports.currentBusinessTime)();
    return date < today || (date === today && time < currentTime);
};
exports.isPastBusinessSlot = isPastBusinessSlot;
const compareTime = (a, b) => a.localeCompare(b);
exports.compareTime = compareTime;
