export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface ErrorResponse {
  status: number;
  message: string;
  path: string;
  timestamp: string;
}

export interface ValidationErrorResponse {
  status: number;
  message: string;
  errors: { [field: string]: string };
  path: string;
  timestamp: string;
}