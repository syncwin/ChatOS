# ChatOS Development Environment Setup

This guide provides comprehensive instructions for setting up a local development environment that mirrors production, including both guest and authenticated user flows.

## Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase CLI** (optional, for local Supabase development)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/chatos.git
cd chatos

# Install dependencies
npm install
# or
yarn install
```

### 2. Environment Configuration

**IMPORTANT**: The application uses environment variables for security and configuration management.

#### Local Development Setup

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in your local/development values** in `.env`:
   ```bash
   # Required Supabase configuration
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   # Optional development settings
   VITE_PORT=8080
   VITE_HOST=localhost
   VITE_DEV_MODE=true
   ```

3. **Never commit production secrets** - The `.env` file is automatically ignored by git.

#### Production Deployment (Coolify)

- **Local**: Use `.env` file for development (not committed to git)
- **Production**: Set environment variables in Coolify UI under "Environment Variables"
- **Required variables for production**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - Mark as **Build Variable** in Coolify for Vite builds

> **Security Note**: 
> - `.env` is ignored by git to prevent accidental commits of secrets
> - Use `.env.example` as a template for required variables
> - Production secrets are managed exclusively through Coolify UI

### 3. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at:
- **Local**: `http://localhost:8080`
- **Network**: `http://[your-ip]:8080`

## API Key Security & Management

ChatOS implements a dual-tier security model for API key management:

### Guest Users (Temporary Storage)
- **Encryption**: AES-256-GCM with session-specific keys
- **Storage**: Browser sessionStorage (never localStorage)
- **Cleanup**: Automatic removal on multiple triggers
- **Session Timeout**: 30 minutes of inactivity
- **Warning System**: Clear security notifications

### Authenticated Users (Database Storage)
- **Database**: Encrypted storage in Supabase with RLS
- **Access Control**: JWT-based authentication required
- **Row Level Security**: Users can only access their own keys
- **Audit Trail**: All access is logged and monitored
- **Persistence**: Keys persist across sessions and devices

### Security Documentation
For detailed information about the API key management system, see:
- [`docs/API_KEY_MANAGEMENT.md`](./docs/API_KEY_MANAGEMENT.md) - Complete security documentation
- [`.env.example`](./.env.example) - Environment variable template

## User Flow Testing

### Guest User Flow

Guest users can use the application without authentication by providing their own API keys:

1. **Access Guest Mode**:
   - Navigate to `http://localhost:8080`
   - Click "Continue as Guest" on the auth page

2. **Add API Keys**:
   - Go to Settings (gear icon in sidebar)
   - Add API keys for supported providers:
     - OpenAI
     - Anthropic
     - Google Gemini
     - Mistral
     - OpenRouter

3. **Test Chat Functionality**:
   - Create new chats
   - Send messages using different AI providers
   - Switch between models
   - Organize chats with folders and tags

4. **Enhanced Security Features**:
   - **AES-256-GCM Encryption**: API keys are encrypted with industry-standard encryption
   - **Session-based Storage**: Keys are tied to browser session with unique session IDs
   - **Auto-cleanup**: Multiple cleanup triggers ensure keys are removed:
     - Page unload/reload
     - Tab becomes hidden
     - 30 minutes of inactivity
     - Manual logout
   - **No Persistence**: Keys never persist between browser sessions
   - **Security Warning**: Users are informed about temporary storage nature

### Authenticated User Flow

1. **User Registration/Login**:
   - Navigate to `http://localhost:8080`
   - Sign up with email/password or sign in
   - Email verification may be required

2. **Profile Setup**:
   - Complete user profile
   - Add API keys in Settings (stored securely in database)
   - Configure preferences

3. **Full Feature Access**:
   - Persistent chat history
   - Folder and tag management
   - Profile customization
   - Secure API key storage

## API Key Requirements

To test the application, you'll need API keys from at least one provider:

### OpenAI
- Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Models: `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`, `o1-preview`, `o1-mini`

### Anthropic
- Get API key from [Anthropic Console](https://console.anthropic.com/)
- Models: `claude-3-5-haiku-20241022`, `claude-sonnet-4-20250514`, `claude-opus-4-20250514`

### Google Gemini
- Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Models: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`

### Mistral
- Get API key from [Mistral Platform](https://console.mistral.ai/)
- Models: `mistral-small-latest`, `mistral-medium-latest`, `mistral-large-latest`

### OpenRouter
- Get API key from [OpenRouter](https://openrouter.ai/keys)
- Access to multiple models from different providers

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Structure

```
chatos/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── ui/             # UI components (shadcn/ui)
│   │   └── icons/          # Icon components
│   ├── contexts/           # React contexts
│   ├── features/           # Feature-specific code
│   │   └── chat/           # Chat functionality
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase configuration
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   └── services/           # API services
├── supabase/
│   ├── functions/          # Edge functions
│   │   └── ai-chat/        # AI chat function
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Key Features to Test

### Core Functionality
- [ ] User authentication (sign up, sign in, sign out)
- [ ] Guest mode access
- [ ] API key management (add, edit, delete)
- [ ] Chat creation and management
- [ ] Message sending and receiving
- [ ] Provider and model switching
- [ ] Real-time streaming responses (OpenAI)

### Organization Features
- [ ] Folder creation and management
- [ ] Tag creation and assignment
- [ ] Chat search and filtering
- [ ] Chat pinning
- [ ] Chat history persistence

### UI/UX Features
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark/light theme switching
- [ ] Sidebar navigation
- [ ] Settings dialog
- [ ] Profile management
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting

## Security Testing

### Guest Mode Security
- [ ] API keys encrypted in sessionStorage
- [ ] Keys cleared on session end
- [ ] No persistent storage of sensitive data
- [ ] Security warnings displayed to users

### Authenticated Mode Security
- [ ] API keys encrypted in database
- [ ] User data isolation (RLS policies)
- [ ] Secure authentication flow
- [ ] Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Port 8080 already in use**:
   ```bash
   # Kill process using port 8080
   npx kill-port 8080
   # Or change port in vite.config.ts
   ```

2. **API key not working**:
   - Verify API key is valid and has sufficient credits
   - Check provider-specific requirements
   - Ensure correct model names are used

3. **Supabase connection issues**:
   - Verify internet connection
   - Check Supabase service status
   - Ensure project ID is correct

4. **Build errors**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode

Enable debug logging by opening browser DevTools and checking:
- Console logs for API calls
- Network tab for request/response details
- Application tab for localStorage/sessionStorage

## Performance Considerations

- **Development server**: Hot reload enabled, not optimized for performance
- **Production build**: Optimized bundles with code splitting
- **API rate limits**: Be mindful of provider rate limits during testing
- **Local storage**: Guest mode uses sessionStorage, limited by browser

## Contributing

When contributing to the project:

1. Test both guest and authenticated flows
2. Verify API key security measures
3. Ensure responsive design works
4. Test with multiple AI providers
5. Check for memory leaks in long sessions
6. Validate input sanitization

## Support

For development issues:
1. Check this guide first
2. Review existing GitHub issues
3. Create detailed bug reports with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS information
   - Console error messages

---

**Ready to start developing!** 🚀

The application should now be running at `http://localhost:8080` with both guest and authenticated user flows fully testable.