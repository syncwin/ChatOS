# API Key Management Documentation

This document explains how ChatOS handles API key management for both guest users and authenticated users, including security measures and implementation details.

## Overview

ChatOS supports two user modes:
- **Guest Mode**: Temporary users who provide API keys for immediate use
- **Authenticated Mode**: Registered users with persistent, encrypted API key storage

## Guest User API Key Management

### Storage Mechanism

**Location**: Browser `sessionStorage` with AES-256-GCM encryption

**Security Features**:
- **Encryption**: API keys are encrypted using AES-256-GCM with a session-specific key
- **Session-based**: Keys are tied to the browser session and automatically cleared
- **Auto-cleanup**: Multiple cleanup triggers ensure keys don't persist

### Implementation Details

#### Encryption Process
1. **Session ID Generation**: A unique session ID is created using `crypto.randomUUID()`
2. **Key Derivation**: Encryption key is derived using PBKDF2 with 100,000 iterations
3. **Encryption**: API keys are encrypted with AES-256-GCM using random IVs
4. **Storage**: Encrypted keys are stored in `sessionStorage` with provider-specific keys

#### Storage Format
```
sessionStorage:
├── chat_session_id: "uuid-v4-string"
├── guest_api_key_openai: "base64-encrypted-key"
├── guest_api_key_anthropic: "base64-encrypted-key"
└── guest_api_key_gemini: "base64-encrypted-key"
```

#### Cleanup Triggers
- **Page unload/reload**: `beforeunload`, `pagehide`, `unload` events
- **Tab visibility**: When tab becomes hidden (`visibilitychange`)
- **Session timeout**: 30 minutes of user inactivity
- **Manual logout**: When user switches to authenticated mode

### Security Considerations

**Strengths**:
- Client-side encryption prevents plain-text storage
- Session-based storage limits exposure time
- Multiple cleanup mechanisms ensure data removal
- No server-side storage of guest keys

**Limitations**:
- Keys exist in browser memory during use
- Vulnerable to XSS attacks (mitigated by CSP)
- No persistence across browser sessions

## Authenticated User API Key Management

### Storage Mechanism

**Location**: Supabase database with Row Level Security (RLS)

**Security Features**:
- **Database encryption**: Supabase handles encryption at rest
- **Row Level Security**: Users can only access their own API keys
- **Secure transmission**: HTTPS for all API communications
- **Access control**: JWT-based authentication required

### Implementation Details

#### Database Schema
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

#### Row Level Security Policies
```sql
-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own API keys
CREATE POLICY "Users can insert own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own API keys
CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own API keys
CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);
```

#### API Key Retrieval Flow
1. **Authentication**: User JWT token is validated
2. **Database Query**: RLS ensures user can only access their keys
3. **Edge Function**: Supabase Edge Function handles secure retrieval
4. **AI Provider**: Key is used to authenticate with AI provider

## API Key Flow Diagrams

### Guest User Flow
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ User enters │───▶│ Encrypt key  │───▶│ Store in        │
│ API key     │    │ (AES-256-GCM)│    │ sessionStorage  │
└─────────────┘    └──────────────┘    └─────────────────┘
                                                │
                                                ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ AI Provider │◀───│ Decrypt key  │◀───│ Retrieve from   │
│ API call    │    │              │    │ sessionStorage  │
└─────────────┘    └──────────────┘    └─────────────────┘
```

### Authenticated User Flow
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ User enters │───▶│ Validate JWT │───▶│ Store in        │
│ API key     │    │ token        │    │ Supabase DB     │
└─────────────┘    └──────────────┘    └─────────────────┘
                                                │
                                                ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ AI Provider │◀───│ Edge Function│◀───│ Query with RLS  │
│ API call    │    │ retrieval    │    │ protection      │
└─────────────┘    └──────────────┘    └─────────────────┘
```

## Security Best Practices

### For Guest Users
1. **Inform users** about temporary storage nature
2. **Clear warnings** about session-based security
3. **Encourage registration** for better security
4. **Automatic cleanup** on session end

### For Authenticated Users
1. **Strong authentication** required
2. **Encrypted storage** in database
3. **Access logging** for audit trails
4. **Regular key rotation** recommendations

### General Security
1. **HTTPS only** for all communications
2. **Content Security Policy** to prevent XSS
3. **Input validation** for all API keys
4. **Rate limiting** on API key operations

## Environment Variables

### Required Variables
```bash
# Frontend (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend (Supabase Edge Functions)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Security Notes
- **ANON_KEY**: Safe to expose in frontend (public key)
- **SERVICE_ROLE_KEY**: Must be kept secret (server-side only)
- **Environment files**: Never commit to version control

## Migration Guide

### From Hardcoded to Environment Variables

1. **Create `.env.local`** file in project root
2. **Copy values** from `.env.example`
3. **Update Supabase keys** if needed
4. **Restart development server**

### Testing the Migration

1. **Guest mode**: Verify API key encryption/decryption
2. **Auth mode**: Test database key storage/retrieval
3. **Environment**: Confirm variables are loaded correctly
4. **Security**: Validate cleanup mechanisms work

## Troubleshooting

### Common Issues

**Guest keys not persisting**:
- Expected behavior - keys are session-based
- Check browser console for encryption errors

**Authenticated keys not saving**:
- Verify user is properly authenticated
- Check RLS policies are enabled
- Confirm database permissions

**Environment variables not loading**:
- Ensure `.env.local` exists in project root
- Restart development server
- Check variable names match exactly

### Debug Commands

```javascript
// Check guest storage
console.log(secureGuestStorage.getStoredProviders());
console.log(secureGuestStorage.getSecurityInfo());

// Check environment variables
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

## Future Enhancements

1. **Key rotation**: Automatic rotation for authenticated users
2. **Usage analytics**: Track API key usage patterns
3. **Enhanced encryption**: Consider additional encryption layers
4. **Backup/restore**: Key backup functionality for users
5. **Multi-device sync**: Sync keys across user devices

## Compliance

- **GDPR**: User data is properly handled and can be deleted
- **SOC 2**: Supabase provides SOC 2 Type II compliance
- **Encryption**: Industry-standard encryption methods used
- **Access control**: Proper authentication and authorization