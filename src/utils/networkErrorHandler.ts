/**
 * Network Error Handler Utility
 * Handles network-related errors and provides user-friendly error messages
 */

export interface NetworkError {
  code: string;
  message: string;
  isNetworkError: boolean;
  shouldRetry: boolean;
}

export class NetworkErrorHandler {
  /**
   * Check if the error is a network-related error
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    const networkKeywords = [
      'network',
      'offline',
      'connection',
      'timeout',
      'unreachable',
      'failed to fetch',
      'fetch failed',
    ];

    return networkKeywords.some(
      keyword => errorMessage.includes(keyword) || errorCode.includes(keyword)
    );
  }

  /**
   * Get a user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    if (!error) return 'An unknown error occurred';

    // Check if it's a network error
    if (this.isNetworkError(error)) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    // Firebase-specific error messages
    const errorCode = error.code || '';
    
    // Auth errors
    if (errorCode.startsWith('auth/')) {
      return this.getAuthErrorMessage(errorCode);
    }

    // Firestore errors
    if (errorCode.startsWith('firestore/')) {
      return this.getFirestoreErrorMessage(errorCode);
    }

    // Database errors
    if (errorCode.startsWith('database/')) {
      return this.getDatabaseErrorMessage(errorCode);
    }

    // Default to the error message if available
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Get user-friendly auth error messages
   */
  private static getAuthErrorMessage(code: string): string {
    const authErrors: Record<string, string> = {
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/requires-recent-login': 'Please sign in again to continue.',
      'auth/invalid-credential': 'Invalid credentials. Please try again.',
    };

    return authErrors[code] || 'Authentication error occurred.';
  }

  /**
   * Get user-friendly Firestore error messages
   */
  private static getFirestoreErrorMessage(code: string): string {
    const firestoreErrors: Record<string, string> = {
      'firestore/permission-denied': 'Permission denied. Please sign in.',
      'firestore/unavailable': 'Service temporarily unavailable. Please try again.',
      'firestore/not-found': 'Requested data not found.',
      'firestore/already-exists': 'Data already exists.',
    };

    return firestoreErrors[code] || 'Database error occurred.';
  }

  /**
   * Get user-friendly Realtime Database error messages
   */
  private static getDatabaseErrorMessage(code: string): string {
    const databaseErrors: Record<string, string> = {
      'database/permission-denied': 'Permission denied. Please sign in.',
      'database/disconnected': 'Connection lost. Please check your internet.',
      'database/network-error': 'Network error. Please try again.',
    };

    return databaseErrors[code] || 'Database error occurred.';
  }

  /**
   * Determine if an error should trigger a retry
   */
  static shouldRetry(error: any): boolean {
    if (!error) return false;

    const retryableErrors = [
      'network',
      'timeout',
      'unavailable',
      'disconnected',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    return retryableErrors.some(
      keyword => errorMessage.includes(keyword) || errorCode.includes(keyword)
    );
  }

  /**
   * Parse an error into a standardized NetworkError object
   */
  static parseError(error: any): NetworkError {
    return {
      code: error.code || 'unknown',
      message: this.getUserFriendlyMessage(error),
      isNetworkError: this.isNetworkError(error),
      shouldRetry: this.shouldRetry(error),
    };
  }

  /**
   * Log error for debugging (development only)
   */
  static logError(error: any, context?: string): void {
    if (__DEV__) {
      console.error(`[NetworkErrorHandler${context ? ` - ${context}` : ''}]:`, {
        error,
        parsed: this.parseError(error),
        timestamp: new Date().toISOString(),
      });
    }
  }
}
