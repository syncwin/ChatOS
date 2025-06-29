# Supabase Redirect URL Configuration

This document explains how to properly configure Supabase redirect URLs to ensure authentication flows work correctly on your custom domain.

## The Problem

Supabase requires explicit redirect URLs to be configured in the dashboard. Even though our application uses `window.location.origin` for dynamic domain resolution, Supabase will only allow redirects to URLs that are explicitly whitelisted in the project settings.

## Required Configuration

### 1. Supabase Dashboard Setup

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following URLs to **Additional Redirect URLs**:

```
# For production domain
https://your-custom-domain.com/
https://your-custom-domain.com/update-password

# For development (if needed)
http://localhost:8080/
http://localhost:8080/update-password
http://127.0.0.1:8080/
http://127.0.0.1:8080/update-password
```

### 2. Site URL Configuration

Set the **Site URL** in Supabase to your production domain:
```
https://your-custom-domain.com
```

### 3. Environment Variables

Add the following to your `.env.local` file:

```bash
# Base URL for your application
VITE_BASE_URL=https://your-custom-domain.com

# Supabase configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Authentication Flow URLs

Our application uses the following redirect patterns:

### Google OAuth
- **Redirect URL**: `${window.location.origin}/`
- **Used in**: `GoogleAuthButton.tsx`

### Email Sign Up
- **Redirect URL**: `${window.location.origin}/`
- **Used in**: `Auth.tsx` (sign up flow)

### Password Reset
- **Redirect URL**: `${window.location.origin}/update-password`
- **Used in**: `Auth.tsx` (password reset flow)

### Email Confirmation
- **Redirect URL**: `${window.location.origin}/`
- **Used in**: `ProfileForm.tsx` (email change confirmation)

## Troubleshooting

### Issue: "Invalid redirect URL" error
**Solution**: Ensure your domain is added to the Additional Redirect URLs in Supabase dashboard.

### Issue: Redirects go to localhost in production
**Solution**: 
1. Check that `VITE_BASE_URL` is set correctly
2. Verify Supabase Site URL is set to your production domain
3. Clear browser cache and cookies

### Issue: Email links don't work
**Solution**:
1. Verify the exact redirect URL in Supabase dashboard
2. Check that the email template uses the correct domain
3. Ensure `/update-password` route exists and is properly configured

## Security Considerations

1. **Never add wildcard domains** to redirect URLs
2. **Only add trusted domains** you control
3. **Use HTTPS** for all production URLs
4. **Regularly audit** your redirect URL list

## Testing

To test the configuration:

1. **Google OAuth**: Try signing in/up with Google
2. **Password Reset**: Request a password reset and click the email link
3. **Email Confirmation**: Change your email and click the confirmation link
4. **Sign Up**: Create a new account and check email confirmation

All flows should redirect to your custom domain, not localhost or any other domain.