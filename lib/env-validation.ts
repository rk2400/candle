/**
 * Environment Variable Validation
 * Run this at startup to ensure all required variables are set
 * 
 * Usage: Call validateEnv() in your app initialization
 */

import { config } from './config';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical validations
  try {
    // Database
    if (!config.db.uri || config.db.uri.includes('localhost') && config.app.isProduction()) {
      warnings.push('Using localhost MongoDB in production is not recommended');
    }

    // Auth secrets
    if (config.app.isProduction()) {
      if (config.auth.jwtSecret === 'change-this-secret-in-production') {
        errors.push('JWT_SECRET must be set to a secure value in production');
      }
      if (config.auth.otpSecret === 'change-this-otp-secret-in-production') {
        errors.push('OTP_SECRET must be set to a secure value in production');
      }
    }

    // Email configuration (optional but recommended)
    if (!config.email.isConfigured()) {
      warnings.push('Email is not configured. Emails will be logged to console (mock mode)');
    }

    // App URL
    if (config.app.url === 'http://localhost:3000' && config.app.isProduction()) {
      warnings.push('NEXT_PUBLIC_APP_URL should be set to your production domain');
    }

  } catch (error: any) {
    errors.push(`Configuration error: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('\n❌ Environment Configuration Errors:');
    result.errors.forEach((error) => {
      console.error(`   • ${error}`);
    });
    console.error('\nPlease fix these errors before starting the application.\n');
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:');
    result.warnings.forEach((warning) => {
      console.warn(`   • ${warning}`);
    });
    console.warn('');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Environment configuration is valid\n');
  }
}

/**
 * Validate and exit if invalid (for scripts)
 */
export function validateEnvOrExit(): void {
  const result = validateEnv();
  printValidationResults(result);
  
  if (!result.valid) {
    process.exit(1);
  }
}



