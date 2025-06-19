# ChatOS

ChatOS is an open-source, extensible AI chatbot platform that empowers anyone to deploy, customize, and manage multi-provider AI chat experiences on their own infrastructure. With ChatOS, users can integrate their own API keys from leading AI providers like OpenAI, Anthropic, Gemini, Mistral, OpenRouter, and more—while organizing and managing conversations in a fully self-hosted environment.

---

## Features

- **Multi-Provider Support**: Connect to OpenAI, Google Gemini, Anthropic, Mistral, and any OpenRouter-compatible provider.
- **Dynamic Model Selection**: Automatically fetches and displays the latest models available from your chosen provider.
- **Robust Error Handling**: Includes automatic retries with exponential backoff and real-time error reporting with Sentry.

- **Folders & Tags**  
  Organize chats with folders and tags, accessible from both the header and sidebar with a unified, icon-based UI.

- **Accessibility**  
  Modern UI/UX, high-contrast modes, screen reader support, and keyboard navigation.

- **Security & Compliance**  
  Encrypted API key storage, GDPR/SOC2/ISO27001 features, and audit trails.

---

## Quick Start

### Automated Setup (Recommended)

For the fastest setup experience, use our automated setup script:

```powershell
# Clone the repository
git clone https://github.com/your-org/chatos.git
cd chatos

# Run automated setup script (Windows PowerShell)
.\scripts\dev-setup.ps1

# Or run with options
.\scripts\dev-setup.ps1 -Help  # Show all options
```

The script will:
- ✅ Check prerequisites (Node.js 18+, npm, Git)
- 📦 Install dependencies
- 🔧 Set up environment configuration
- 🗄️ Configure Supabase (if available)
- 🚀 Start development server

### Manual Setup

If you prefer manual setup:

```sh
# Step 1: Clone the repository
git clone https://github.com/your-org/chatos.git

# Step 2: Navigate to the project directory
cd chatos

# Step 3: Install dependencies
npm install

# Step 4: Configure environment (optional)
cp .env.example .env
# Edit .env with your configuration

# Step 5: Start development server
npm run dev
```

### Access Your Local Instance

- **Local**: http://localhost:8080
- **Network**: Use `scripts\get-network-info.ps1` to get network URLs for sharing
- **External**: Use ngrok or localtunnel for external testing

📋 **Complete setup guide**: [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)

## Testing & Quality Assurance

### Guest & Authenticated User Testing

ChatOS supports both **guest users** (session-based) and **authenticated users** (persistent data). Both flows must be thoroughly tested:

#### Guest Mode Testing
- ✅ Session-based API key storage (encrypted)
- ✅ Temporary chat data (cleared on session end)
- ✅ No persistent data storage
- ✅ Security warnings displayed

#### Authenticated Mode Testing
- ✅ User registration and login
- ✅ Persistent API key storage (encrypted)
- ✅ Chat history and data persistence
- ✅ Profile management

### Testing Resources

- 📋 **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Comprehensive testing checklist covering all features
- 🌐 **Network Testing**: Use `scripts\get-network-info.ps1` to get URLs for live testing
- 🔧 **Setup Automation**: Use `scripts\dev-setup.ps1` for consistent environment setup

### AI Provider Testing

Test integration with multiple AI providers:
- **OpenAI** (GPT-4o, GPT-4o-mini)
- **Anthropic** (Claude variants)
- **Google Gemini** (Gemini Pro, Flash)
- **Mistral** (Various models)
- **OpenRouter** (Multiple model access)

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and follow our [Code of Conduct](CODE_OF_CONDUCT.md).  
- Use structured code and checklists for all features and pull requests.
- Ask clarifying questions if requirements are unclear before submitting code.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Credits

ChatOS is developed and maintained by the open-source community, inspired by the best features of Perplexity, DeepSeek, and ChatGPT with a focus on modularity, security, and user empowerment.