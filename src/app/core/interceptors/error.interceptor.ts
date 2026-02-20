import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Invalid request. Please check your input.';
            break;
          case 401:
            // Handled by auth interceptor, but show message
            errorMessage = 'Your session has expired. Please log in again.';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = error.error?.message || 'The requested resource was not found.';
            break;
          case 409:
            errorMessage = error.error?.message || 'A conflict occurred. The resource may already exist.';
            break;
          case 422:
            // Validation error - show field errors if available
            if (error.error?.errors) {
              const fieldErrors = Object.values(error.error.errors).join(', ');
              errorMessage = fieldErrors;
            } else {
              errorMessage = error.error?.message || 'Validation failed. Please check your input.';
            }
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'A server error occurred. Please try again later.';
            break;
          case 503:
            errorMessage = 'The service is temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error: ${error.status} - ${error.statusText}`;
        }
      }

      // Don't show notification for 401 errors (handled by auth interceptor)
      if (error.status !== 401) {
        notification.error(errorMessage);
      }

      return throwError(() => error);
    })
  );
};