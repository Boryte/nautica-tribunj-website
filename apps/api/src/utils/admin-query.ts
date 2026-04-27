export interface AdminListQuery {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
}

export const parseAdminListQuery = (query: Record<string, unknown>): AdminListQuery => {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 12) || 12));
  return {
    page,
    pageSize,
    search: String(query.search ?? '').trim(),
    status: query.status ? String(query.status) : undefined,
  };
};

export const paginateItems = <T>(items: T[], page: number, pageSize: number) => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  total: items.length,
  page,
  pageSize,
});
