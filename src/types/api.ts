/** Standard API response wrapper */
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/** Common query params for paginated endpoints */
export interface PaginationParams {
  page?: number
  pageSize?: number
}
