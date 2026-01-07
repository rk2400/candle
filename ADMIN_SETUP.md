# Admin Setup Guide

## Admin Authorization

AuraFarm uses a simple but secure admin authorization system based on email matching.

### How It Works

1. **Super Admin Email**: The email address defined in the `ADMIN_EMAIL` environment variable is treated as the super admin.

2. **Automatic Admin Detection**: 
   - When a user logs in via OTP, the system checks if their email matches `ADMIN_EMAIL`
   - If it matches → User gets admin privileges (JWT token with `type: 'admin'`)
   - If it doesn't match → User gets normal privileges (JWT token with `type: 'user'`)

3. **No Separate Admin Login**: 
   - Admin users use the same login flow as regular users
   - They just need to use the email defined in `ADMIN_EMAIL`
   - No password required (OTP-based authentication)

### Setting Up Admin

1. **Set Admin Email in Environment**:
   ```env
   ADMIN_EMAIL=admin@aurafarm.com
   ```

2. **Create Admin Account**:
   - Go to `/signup`
   - Register with the email matching `ADMIN_EMAIL`
   - Complete the signup process

3. **Login as Admin**:
   - Go to `/login`
   - Enter the admin email
   - Verify OTP
   - You'll automatically get admin privileges

4. **Access Admin Panel**:
   - After login, you'll see an "Admin" link in the header
   - Or navigate to `/admin/dashboard`

### Admin Features

Once logged in as admin, you have access to:

- **Dashboard**: View statistics (orders, revenue, products, users)
- **Products**: Create, edit, delete products, manage stock
- **Orders**: View all orders, update order status
- **Users**: View list of all registered users
- **Email Templates**: Manage email templates for order notifications

### Security Notes

- Admin authorization is checked on **both frontend and backend**
- Frontend: `AdminHeader` component redirects non-admin users
- Backend: `withAdminAuth` middleware protects all admin API routes
- Admin check compares email (case-insensitive) with `ADMIN_EMAIL`
- JWT token includes `type: 'admin'` for admin users

### Changing Admin Email

To change the admin email:

1. Update `ADMIN_EMAIL` in `.env.local`
2. The new email user will get admin privileges on next login
3. The old email user will lose admin privileges (unless they match the new email)

### Multiple Admins

Currently, only one admin is supported (the email matching `ADMIN_EMAIL`). To add multiple admins, you would need to:

1. Create an `Admin` model with a list of admin emails
2. Update the authorization logic to check against this list
3. This is a future enhancement

---

**Important**: Keep your `ADMIN_EMAIL` secure and don't commit it to version control!


