export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta extends PaginationParams {
  total: number;
  totalPages: number;
}

export const toSkipTake = ({ page, pageSize }: PaginationParams): { skip: number; take: number } => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

export const buildPaginationMeta = ({ page, pageSize }: PaginationParams, total: number): PaginationMeta => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});
