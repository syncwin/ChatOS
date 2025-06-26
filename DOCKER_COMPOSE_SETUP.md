# 🐳 Docker Compose Setup Guide for ChatOS on Coolify

This guide provides step-by-step instructions to deploy ChatOS using Docker Compose on Coolify.

## 📋 Prerequisites Checklist

- [ ] Coolify instance running and accessible
- [ ] GitHub repository with ChatOS code
- [ ] Supabase project set up (or plan to use local Supabase)
- [ ] Domain name configured (optional)

---

## 1. **Repository Preparation** ✅

- [x] ✅ Project repository contains all necessary code
- [x] ✅ `docker-compose.yml` file created at repository root
- [x] ✅ `Dockerfile` created for frontend build
- [x] ✅ `.dockerignore` created to optimize builds

---

## 2. **Docker Compose Configuration** ✅

The `docker-compose.yml` includes:

- [x] ✅ **Frontend service** (Vite React app)
  - Build context and Dockerfile specified
  - Environment variables configured
  - Health check implemented
  - **No ports exposed** (Coolify handles this)
- [x] ✅ **Optional Supabase local stack** (commented out by default)
  - PostgreSQL database
  - Supabase Studio
  - Kong API Gateway

### Key Configuration Details:

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
        - VITE_ANTHROPIC_API_KEY=${VITE_ANTHROPIC_API_KEY:-}
        - VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
        - OPENAI_API_KEY=${OPENAI_API_KEY:-}
    environment:
      - NODE_ENV=production
    # No ports section - Coolify manages this
```

---

## 3. **Environment Variables Setup**

### Required Variables:
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional Variables:
- [ ] `VITE_ANTHROPIC_API_KEY` - Anthropic API key
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `VITE_SENTRY_DSN` - Sentry error tracking

### Environment File Options:

1. **Use `.env.production` template:**
   ```bash
   cp .env.production .env
   # Edit .env with your actual values
   ```

2. **Or configure directly in Coolify UI** (recommended for production)

---

## 4. **Commit & Push**

- [ ] Commit all Docker files to your repository:
  ```bash
  git add docker-compose.yaml Dockerfile .dockerignore .env.production DOCKER_COMPOSE_SETUP.md
  git commit -m "Add Docker Compose setup for Coolify deployment"
  git push origin main
  ```

---

## 5. **Coolify Setup**

### Step-by-Step Coolify Configuration:

1. **Create New Resource:**
   - [ ] In Coolify dashboard, click "+ New Resource"
   - [ ] Select "Application"

2. **Repository Configuration:**
   - [ ] Choose deployment method (GitHub App recommended)
   - [ ] Select your ChatOS repository
   - [ ] Choose branch (usually `main`)

3. **Build Configuration:**
   - [ ] **IMPORTANT:** Select "Docker Compose" as build pack
   - [ ] Set Docker Compose file path: `/docker-compose.yaml`
   - [ ] Set base directory: `/` (root)

4. **Service Configuration:**
   - [ ] Select the `frontend` service as the main service
   - [ ] Set port to `4173` (Vite preview default)

5. **Environment Variables:**
   - [ ] Add required environment variables in Coolify UI (as regular Environment Variables, NOT build variables):
   - [ ] `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
   - [ ] `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`
   
   **Optional variables:**
   - [ ] `VITE_ANTHROPIC_API_KEY=your_anthropic_key`
   - [ ] `OPENAI_API_KEY=your_openai_key`
   - [ ] `VITE_SENTRY_DSN=your_sentry_dsn`
   
   **Important**: The Docker Compose setup automatically handles passing VITE_ variables as build arguments during the build process.

---

## 6. **Environment Variables in Coolify**

### Add these in Coolify UI:

**Required:**
- [ ] `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`

**Optional:**
- [ ] `VITE_ANTHROPIC_API_KEY=your_anthropic_key`
- [ ] `OPENAI_API_KEY=sk-your_openai_key`
- [ ] `VITE_SENTRY_DSN=your_sentry_dsn`

---

## 7. **Deploy**

- [ ] Click "Deploy" in Coolify
- [ ] Monitor build logs for any errors
- [ ] Wait for deployment to complete

---

## 8. **Post-Deployment Verification**

### Health Checks:
- [ ] Application loads successfully
- [ ] Supabase connection working
- [ ] AI chat functionality operational
- [ ] API key management working

### Test Scenarios:
- [ ] **Guest Mode:** Test with temporary API keys
- [ ] **Authenticated Mode:** Test with user accounts
- [ ] **Multiple Providers:** Test OpenAI, Anthropic, etc.

---

## 9. **Domain Configuration (Optional)**

If using a custom domain:

- [ ] Configure domain in Coolify
- [ ] Set up SSL certificate
- [ ] Update CORS settings in Supabase if needed

---

## 🔧 **Troubleshooting**

### Common Issues:

1. **Blank Screen with "Missing required Supabase environment variables" Error:**
   - **Cause**: VITE_ environment variables not available during build time
   - **Solution**: Ensure you're using the updated Docker Compose configuration with build args
   - [ ] Verify `docker-compose.yaml` includes `args` section under `build`
   - [ ] Check that environment variables are set in Coolify UI as regular "Environment Variables" (not build variables)
   - [ ] Redeploy the application after updating configuration

2. **Build Fails:**
   - [ ] Check Docker build logs in Coolify
   - [ ] Verify all files are committed
   - [ ] Ensure `.dockerignore` isn't excluding required files
   - [ ] Check environment variables are set correctly in Coolify
   - [ ] Ensure all required variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are provided

3. **App doesn't start:**
   - [ ] Verify health check endpoint responds at `http://localhost:4173`
   - [ ] Check container logs in Coolify
   - [ ] Ensure port 4173 is exposed correctly
   - [ ] Verify the built application exists in `/app/dist`

4. **Environment Variables:**
   - [ ] Verify all required variables are set
   - [ ] Check variable names match exactly (case-sensitive)
   - [ ] Ensure Supabase URL and keys are correct
   - [ ] For VITE_ variables: ensure they're passed as build arguments
   - [ ] Check browser console for specific error messages

5. **Port Issues:**
   - [ ] Confirm port `4173` is configured in Coolify
   - [ ] Check health check is passing

6. **Supabase Connection:**
   - [ ] Verify Supabase URL is accessible
   - [ ] Check CORS settings in Supabase
   - [ ] Confirm API keys have correct permissions

### Debug Commands:

```bash
# Check container logs
docker-compose logs frontend

# Test local build
docker-compose up --build

# Verify environment variables
docker-compose config
```

---

## 📚 **Additional Resources**

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Supabase Documentation](https://supabase.com/docs)
- [ChatOS Development Setup](./DEVELOPMENT_SETUP.md)

---

## 🎉 **Success!**

Once deployed, your ChatOS application will be:
- ✅ Running in production mode
- ✅ Automatically scaling with Coolify
- ✅ Secured with proper environment variables
- ✅ Monitored with health checks
- ✅ Ready for your users!

---

*For development setup, see [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)*