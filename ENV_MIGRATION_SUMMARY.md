# Environment Variables Migration Summary

## What Was Changed

### 1. Created Centralized Configuration (`lib/config.ts`)
- All environment variables are now accessed through a centralized config module
- Type-safe access with proper defaults
- Production validation (warns about insecure defaults)
- Clear error messages for missing required variables

### 2. Updated All Files to Use Config
The following files were updated to use the centralized config:

- `lib/db.ts` - Database connection
- `lib/auth.ts` - JWT and OTP configuration
- `lib/email.ts` - Email service configuration
- `app/api/auth/login/route.ts` - OTP expiry
- `app/api/payment/verify/route.ts` - Payment merchant ID
- `app/page.tsx` - App URL
- `app/products/page.tsx` - App URL
- `lib/api-client.ts` - App URL (client-side)
- `scripts/init-admin.ts` - Admin credentials
- `scripts/init-email-templates.ts` - Database URI

### 3. Environment Variable Names
**Changed variable names for consistency:**
- `SMTP_HOST` → `EMAIL_HOST`
- `SMTP_PORT` → `EMAIL_PORT`
- `SMTP_USER` → `EMAIL_USER`
- `SMTP_PASS` → `EMAIL_PASS`
- `SMTP_FROM` → `EMAIL_FROM`

**New variables added:**
- `APP_NAME` - Application name
- `OTP_EXPIRY_MINUTES` - OTP expiration time
- `OTP_SECRET` - OTP secret (reserved for future)
- `JWT_EXPIRY` - JWT token expiration
- `UPI_MERCHANT_ID` - Payment merchant ID
- `UPI_TEST_MODE` - Payment test mode flag
- `NODE_ENV` - Environment mode

### 4. Created Validation System
- `lib/env-validation.ts` - Validates env vars on startup
- `npm run validate-env` - Script to validate configuration
- Clear error messages for missing/invalid variables
- Warnings for insecure configurations

### 5. Documentation
- `.env.example` - Comprehensive example with all variables (see note below)
- `ENV_SETUP.md` - Detailed setup guide
- Updated `README.md` - Simplified setup instructions

## Migration Steps for Existing Deployments

If you have an existing deployment:

1. **Update your `.env.local` file:**
   ```bash
   # Rename old variables
   SMTP_HOST → EMAIL_HOST
   SMTP_PORT → EMAIL_PORT
   SMTP_USER → EMAIL_USER
   SMTP_PASS → EMAIL_PASS
   SMTP_FROM → EMAIL_FROM
   ```

2. **Add new optional variables:**
   ```env
   APP_NAME=AuraFarm
   OTP_EXPIRY_MINUTES=10
   JWT_EXPIRY=7d
   UPI_MERCHANT_ID=mock_merchant_123
   UPI_TEST_MODE=true
   NODE_ENV=development
   ```

3. **Validate your configuration:**
   ```bash
   npm run validate-env
   ```

## Benefits

1. **Type Safety** - All config values are typed
2. **Centralized** - One place to manage all environment variables
3. **Validation** - Catches configuration errors early
4. **Documentation** - Clear examples and guides
5. **Security** - Warns about insecure defaults in production
6. **Flexibility** - Easy to add new variables

## Breaking Changes

- **Email variable names changed** - Update your `.env.local` if using SMTP
- **No hardcoded fallbacks** - All variables must be explicitly set (with safe defaults)
- **Production validation** - App will warn/error on insecure configs in production

## Next Steps

1. Copy `.env.example` to `.env.local` (if not already done)
2. Fill in your actual values
3. Run `npm run validate-env` to check configuration
4. Start the app: `npm run dev`

---

**Note:** The `.env.example` file content is provided in the codebase. If you need to create it manually, copy the content from the file creation output or see `ENV_SETUP.md` for the full template.

