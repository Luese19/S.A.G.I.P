/**
 * Environment Validation Utility
 * Validates that all required environment variables are properly configured
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class EnvironmentValidator {
  private static requiredEnvVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
  ];

  private static optionalEnvVars = [
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_APP_NAME',
    'EXPO_PUBLIC_APP_VERSION',
  ];

  /**
   * Validate all environment variables
   */
  static validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    this.requiredEnvVars.forEach(varName => {
      const envValue = process.env[varName as keyof typeof process.env];
      
      if (!envValue) {
        errors.push(`${varName} is not set`);
      } else if (String(envValue).startsWith('your-')) {
        errors.push(`${varName} still has placeholder value`);
      }
    });

    // Check optional variables
    this.optionalEnvVars.forEach(varName => {
      const envValue = process.env[varName as keyof typeof process.env];
      
      if (!envValue) {
        warnings.push(`${varName} is not set (optional)`);
      } else if (String(envValue).startsWith('your-')) {
        warnings.push(`${varName} still has placeholder value (optional)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Print validation results to console
   */
  static printValidationResults(): void {
    const result = this.validate();

    if (result.isValid) {
      console.log('✅ Environment configuration is valid');
    } else {
      console.error('❌ Environment configuration has errors:');
      result.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment configuration warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }

  /**
   * Get a formatted error message for display
   */
  static getErrorMessage(): string | null {
    const result = this.validate();
    
    if (result.isValid) {
      return null;
    }

    return `Environment configuration error:\n\n${result.errors.join('\n')}\n\nPlease check your .env file.`;
  }

  /**
   * Check if Firebase is properly configured
   */
  static isFirebaseConfigured(): boolean {
    return this.validate().isValid;
  }
}
