# Environment Variables Setup Guide

This document explains how to set up environment variables for AuraFarm.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual values

3. **Validate your setup:**
   ```bash
   npm run validate-env
   ```

## File Locations

Next.js loads environment variables in this order (later files override earlier ones):
1. `.env` - Default values (committed to repo)
2. `.env.local` - Local overrides (NOT committed, use this!)
3. `.env.development` - Development-specific
4. `.env.production` - Production-specific

**For local development, use `.env.local`**

## Required Variables

### Database
- `MONGODB_URI` - MongoDB connection string
  - Local: `mongodb://localhost:27017/aurafarm`
  - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/aurafarm`

### Authentication
- `JWT_SECRET` - Secret for signing JWT tokens
  - Generate: `openssl rand -base64 32`
  - **MUST be changed in production!**

### Admin Setup
- `ADMIN_EMAIL` - Initial admin email
- `ADMIN_PASSWORD` - Initial admin password
  - Used by `init-admin.ts` script
  - **Change after first login!**

## Optional Variables

### Email (SMTP)
Leave empty to use mock mode (emails logged to console).

For production:
- `EMAIL_HOST` - SMTP server (e.g., `smtp.gmail.com`)
- `EMAIL_PORT` - SMTP port (usually `587` or `465`)
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password (use app password for Gmail)
- `EMAIL_FROM` - Sender email address

### Application
- `APP_NAME` - Application name (default: "AuraFarm")
- `NEXT_PUBLIC_APP_URL` - Public URL (default: "http://localhost:3000")
- `NODE_ENV` - Environment (development/production)

### OTP Configuration
- `OTP_EXPIRY_MINUTES` - OTP expiration time (default: 10)
- `OTP_SECRET` - OTP secret (reserved for future use)

### Payment
- `UPI_MERCHANT_ID` - Merchant ID for mock payments
- `UPI_TEST_MODE` - Enable test mode (default: true)

## Production Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set `OTP_SECRET` (32+ characters)
- [ ] Configure production `MONGODB_URI`
- [ ] Set up SMTP email service
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Set `UPI_TEST_MODE=false` (when using real payments)
- [ ] Remove default admin credentials

## Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Rotate secrets regularly** - Especially after security incidents
4. **Use different secrets per environment** - Dev, staging, production
5. **Store production secrets securely** - Use your hosting provider's secret management

## Validation

The application validates environment variables on startup. Errors will prevent the app from starting, warnings will be logged but won't stop the app.

To manually validate:
```bash
npm run validate-env
```

## Troubleshooting

### "Missing required environment variable"
- Check that `.env.local` exists
- Verify the variable name matches exactly (case-sensitive)
- Ensure no trailing spaces in variable values

### "Invalid number for environment variable"
- Check that numeric values are valid integers
- Remove any quotes around numbers

### Email not sending
- Check SMTP credentials are correct
- For Gmail, use an App Password (not your regular password)
- Verify SMTP port (587 for TLS, 465 for SSL)
- Check firewall/network allows SMTP connections

### Database connection fails
- Verify MongoDB is running (local) or accessible (Atlas)
- Check connection string format
- For Atlas, whitelist your IP address
- Verify credentials are correct

## Example `.env.local`

```env
# Database
MONGODB_URI=mongodb://localhost:27017/aurafarm

# Auth
JWT_SECRET=your-generated-secret-here
OTP_EXPIRY_MINUTES=10

# Admin
ADMIN_EMAIL=admin@aurafarm.com
ADMIN_PASSWORD=SecurePassword123!

# Email (optional - leave empty for mock mode)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@aurafarm.com

# App
APP_NAME=AuraFarm
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Payment
UPI_MERCHANT_ID=mock_merchant_123
UPI_TEST_MODE=true
```

## Need Help?

- Check `.env.example` for all available variables
- See `lib/config.ts` for configuration structure
- Run validation script: `npm run validate-env`

