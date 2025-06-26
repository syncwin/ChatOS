# Environment Variables Management Guide

This guide provides comprehensive instructions for managing environment variables in both local development and production deployment scenarios.

## Overview

ChatOS uses a secure environment variable management system that separates local development from production deployment:

- **Local Development**: Uses `.env` file (not committed to git)
- **Production**: Uses Coolify UI environment variables
- **Template**: `.env.example` provides required variable documentation

## Local Development Setup

### 1. Initial Setup

```bash
# Copy the environment template
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` with your local/development values:

```bash
# =============================================================================
# SUPABASE CONFIGURATION (REQUIRED)
# =============================================================================

# Supabase Project URL
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anonymous Key (Public key, safe to expose)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# =============================================================================
# OPTIONAL DEVELOPMENT CONFIGURATION
# =============================================================================

# Development server settings
VITE_PORT=8080
VITE_HOST=localhost
VITE_DEV_MODE=true

# =============================================================================
# AI PROVIDER API KEYS (FOR TESTING ONLY)
# =============================================================================

# OpenAI API Key
OPENAI_API_KEY=sk-your_openai_key_here

# Anthropic API Key
VITE_ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here

# Google Gemini API Key
GOOGLE_API_KEY=AIza_your_google_key_here

# Sentry DSN for error reporting
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### 3. Security Notes

- **Never commit `.env` files** - They are automatically ignored by git
- **Use your own API keys** for local testing
- **Don't share production secrets** in development files

## Production Deployment (Coolify)

### 1. Environment Variables Setup

In Coolify UI, navigate to your application and set the following environment variables:

#### Required Variables

| Variable | Type | Description |
|----------|------|-------------|
| `VITE_SUPABASE_URL` | Build Variable | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Build Variable | Your Supabase anonymous key |

#### Optional Variables

| Variable | Type | Description |
|----------|------|-------------|
| `VITE_ANTHROPIC_API_KEY` | Build Variable | Anthropic API key (if needed) |
| `VITE_SENTRY_DSN` | Build Variable | Sentry DSN for error reporting |
| `OPENAI_API_KEY` | Build Variable | OpenAI API key (if needed) |

### 2. Important Notes

- **Mark as Build Variable**: All `VITE_*` variables must be marked as "Build Variable" in Coolify
- **No env files in production**: Don't include `.env` files in production builds
- **Restart after changes**: Stop and start the app in Coolify after variable changes

## Docker Compose Configuration

The `docker-compose.yaml` file properly references environment variables:

```yaml
services:
  frontend:
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_ANTHROPIC_API_KEY=${VITE_ANTHROPIC_API_KEY:-}
      - VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
```

## Troubleshooting

### Variables Locked in Coolify

1. Ensure no `.env` files are included in build context
2. Remove any `env_file:` references in `docker-compose.yaml`
3. Stop and start the application in Coolify
4. Redeploy the application

### Missing Variables

1. Check that all required variables are set in Coolify UI
2. Verify variables are marked as "Build Variable" for Vite
3. Check application logs for specific missing variable errors

### Local Development Issues

1. Ensure `.env` file exists and contains required variables
2. Restart development server after changing variables
3. Check that variable names match exactly (case-sensitive)

## Security Best Practices

### ✅ Do

- Use `.env.example` as a template for required variables
- Set production secrets only in Coolify UI
- Keep `.env` files out of version control
- Use different values for development and production
- Document all required variables in `.env.example`

### ❌ Don't

- Commit `.env` files to git
- Hardcode secrets in source code
- Share production secrets in development files
- Use production secrets in local development
- Include sensitive data in `.env.example`

## Variable Reference

### Required for Application

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Optional for Enhanced Features

- `VITE_ANTHROPIC_API_KEY`: Anthropic Claude API access
- `VITE_SENTRY_DSN`: Error reporting and monitoring
- `OPENAI_API_KEY`: OpenAI GPT API access
- `GOOGLE_API_KEY`: Google Gemini API access

### Development Only

- `VITE_PORT`: Development server port (default: 8080)
- `VITE_HOST`: Development server host (default: localhost)
- `VITE_DEV_MODE`: Enable development features

---

**Note**: This guide ensures secure, maintainable environment variable management across all deployment scenarios. Always follow the principle of least privilege and never expose production secrets unnecessarily.