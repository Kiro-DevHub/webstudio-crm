export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** The list response shape mandated by CLAUDE.md for every list endpoint. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Builds the `{ data, meta }` envelope so no module recomputes totalPages by hand. */
export function paginated<T>(
  data: T[],
  total: number,
  query: { page: number; limit: number },
): Paginated<T> {
  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
