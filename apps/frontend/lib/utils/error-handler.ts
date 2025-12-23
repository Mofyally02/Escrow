/**
 * Utility functions for safely handling API errors
 * Prevents React rendering errors when error objects are passed to components
 */

export interface FastAPIValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: any;
}

/**
 * Safely extract error message from API error response
 * Handles FastAPI validation errors (422) which return arrays of error objects
 */
export function extractErrorMessage(error: any): string {
  // Handle network errors (no response)
  if (error?.request && !error?.response) {
    return 'Network error - unable to reach server. Please check your connection.';
  }
  
  // Handle FastAPI validation errors (422) - detail can be array or string
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    // Array of validation errors (Pydantic)
    if (Array.isArray(detail)) {
      if (detail.length === 0) {
        return 'Validation error';
      }
      
      // Extract first error message
      const firstError = detail[0] as FastAPIValidationError;
      let message = firstError.msg || firstError.message || 'Validation error';
      
      // Add field location if available
      if (firstError.loc && Array.isArray(firstError.loc)) {
        // Filter out numeric indices and 'body' prefix
        const field = firstError.loc
          .filter((loc) => typeof loc === 'string' && loc !== 'body')
          .join('.');
        if (field) {
          message = `${field}: ${message}`;
        }
      }
      
      // Add input value if available (for debugging)
      if (firstError.input !== undefined && firstError.input !== null) {
        const inputStr = typeof firstError.input === 'string' 
          ? firstError.input.substring(0, 50)
          : String(firstError.input).substring(0, 50);
        message += ` (received: ${inputStr})`;
      }
      
      return message;
    }
    
    // String error message
    if (typeof detail === 'string') {
      return detail;
    }
    
    // Object error (shouldn't happen, but handle it)
    if (typeof detail === 'object') {
      return detail.message || detail.msg || JSON.stringify(detail);
    }
  }
  
  // Handle HTTP status codes
  if (error?.response?.status) {
    const status = error.response.status;
    if (status === 401) {
      return 'Authentication required. Please log in again.';
    }
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status === 404) {
      return 'Resource not found. Please refresh and try again.';
    }
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
  }
  
  // Fallback to error message
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // Last resort
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Safely convert any value to a string for rendering
 * Prevents "Objects are not valid as a React child" errors
 */
export function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '[Object]';
    }
  }
  
  return String(value);
}

