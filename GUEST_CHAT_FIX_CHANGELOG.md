# Guest Chat API Fix - Changelog

## Issue Description
Guest users were unable to use the chat functionality due to a 401 "Missing authorization header" error when making requests to the Edge Functions, even though guest API keys were properly configured.

## Root Cause Analysis
The issue was identified in the frontend service layer where API requests to Supabase Edge Functions were missing the required Authorization header for guest users. While authenticated users had their session tokens included in the Authorization header, guest users had no Authorization header at all, causing Supabase to reject the requests with a 401 error.

## Files Modified

### 1. `src/services/aiProviderService.ts`
**Problem**: The `invokeAiChat` function only included an Authorization header when a user session token was available.

**Fix**: Modified the function to always include an Authorization header:
- For authenticated users: Uses the session access token
- For guest users: Uses the Supabase anon key as a Bearer token

```typescript
// Before
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

// After
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
} else {
  headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
}
```

### 2. `src/services/modelservice.ts`
**Problem**: The `getAvailableModels` function had the same missing Authorization header issue for guest users.

**Fix**: Applied the same fix to ensure guest users can fetch available models:
- Added fallback Authorization header using the anon key for guest users

## Technical Details

### Supabase Edge Function Authentication
Even though the Edge Functions are configured with `auth = false` in `supabase/config.toml`, Supabase still requires an Authorization header to be present in the request. This header can contain either:
1. A valid user session token (for authenticated users)
2. The anon key (for guest/unauthenticated users)

### Request Flow
1. **Guest User Flow**:
   - User enables guest access
   - User adds API key via secure storage
   - Frontend sends request with `Authorization: Bearer <anon_key>`
   - Edge Function receives request and processes guest API key

2. **Authenticated User Flow**:
   - User logs in
   - Frontend sends request with `Authorization: Bearer <session_token>`
   - Edge Function receives request and fetches user's stored API key

## Testing
Created `test-guest-functionality.html` to verify the fix:
- Tests guest chat functionality
- Tests model fetching for guest users
- Provides detailed logging for debugging

## Verification Steps
1. ✅ Guest users can now send chat messages without 401 errors
2. ✅ Guest users can fetch available models
3. ✅ Authenticated users continue to work as before
4. ✅ No breaking changes to existing functionality

## Impact
- **Fixed**: Guest chat functionality now works properly
- **Improved**: Better error handling and debugging capabilities
- **Maintained**: Backward compatibility with authenticated users

## Date
2025-01-20

## Status
✅ **RESOLVED** - Guest chat API issue has been fixed and tested.