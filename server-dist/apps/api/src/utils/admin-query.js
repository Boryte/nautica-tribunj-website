"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateItems = exports.parseAdminListQuery = void 0;
const parseAdminListQuery = (query) => {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 12) || 12));
    return {
        page,
        pageSize,
        search: String(query.search ?? '').trim(),
        status: query.status ? String(query.status) : undefined,
    };
};
exports.parseAdminListQuery = parseAdminListQuery;
const paginateItems = (items, page, pageSize) => ({
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
});
exports.paginateItems = paginateItems;
