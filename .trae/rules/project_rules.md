# Knowledge File: Multi-Provider AI Chatbot Platform (TypingMind/TeamGPT Alternative)

## Project Overview

This project is a web-based chatbot platform enabling users to connect their own API keys from various AI providers (OpenRouter, OpenAI, Anthropic, Google Gemini, Mistral, etc.) and start AI-powered conversations. The platform will offer robust chat management, multi-model support, advanced collaboration, and customizable user experience—mirroring and extending features seen in TypingMind and TeamGPT. The goal is to deliver a secure, flexible, and scalable solution for individuals, teams, and organizations seeking unified access to leading LLMs.

---

## User Personas

- **Individual AI Enthusiasts**
  - Experiment with different LLMs.
  - Easy provider switching, privacy, cost control, customization.

- **Teams/Organizations**
  - Collaborative chat spaces, user management, analytics, access control.
  - Integrations with internal tools, data security.

- **Developers/Researchers**
  - Extensibility (plugins, APIs), detailed logs, export options, advanced settings.
  - Use of open-source or custom models.

- **Enterprises/Educational Institutions**
  - Compliance, SSO, audit trails, scalable user management, data protection.
  - On-premise or private cloud deployments.

---

## Feature Specifications

### Core Features

- **Multi-Provider API Integration:** Add/manage API keys for OpenAI, Anthropic, Google Gemini, Mistral, OpenRouter, etc.; select model per chat.
- **Chat Management:** Organize chats into folders, tag, search, pin, export conversations.
- **Collaboration:** Invite team members, share prompts/agents, manage roles and permissions.
- **Customization:** Custom chat settings, themes, branding, context window control.
- **Plugin System:** Support for plugins (web search, image generation, etc.), custom plugin support.
- **Voice and Vision:** Text-to-speech, voice input, image upload/analysis, DALL-E integration.
- **Data Privacy:** Local storage by default, optional cloud sync/backup; no training on user data unless opted-in.
- **Analytics:** Usage stats, token consumption, chat insights for admins.
- **Accessibility:** Multilingual UI, high-contrast modes, text resizing, screen reader support.

### User Stories & Acceptance Criteria

- As a user, I can add my API key for any supported provider, so I can chat using my preferred LLM.
- As an admin, I can invite and manage team members, set permissions, and monitor usage analytics.
- As a developer, I can build and install plugins to extend platform capabilities.
- As a user, I can organize, search, and export my chat history.

---

## Design Assets

- **Design System:** Modern, accessible UI, responsive layouts.
- **Color Palette:** Customizable; default neutral tones with accent colors.
- **Typography:** Sans-serif (e.g., Inter, Roboto).
- **Assets:** Logo, provider icons, chat bubbles, plugin badges.
- **Links:** [Design files to be added as project evolves.]

---

## API Documentation

| Endpoint         | Method | Description                     | Auth        |
|------------------|--------|---------------------------------|-------------|
| /users           | GET    | List all users                  | Admin Token |
| /users           | POST   | Add new user                    | Admin Token |
| /chats           | GET    | List all chats for user         | User Token  |
| /chats           | POST   | Create new chat                 | User Token  |
| /models          | GET    | List available models/providers | User Token  |
| /plugins         | GET    | List available plugins          | User Token  |
| /api-keys        | POST   | Add/manage API keys             | User Token  |

**Provider Integration:**  
- Each provider (OpenAI, Anthropic, etc.) is accessed via user-supplied API key and endpoint.
- Requests are proxied through the platform, with response normalization for unified UX.
- Auth: API keys stored encrypted, only accessible per user/session.

**Authentication:**  
- JWT-based session tokens.
- SSO (OAuth/SAML) for enterprise.

---

## Database Schema

**Entities & Relationships:**
- **User:** id, email, roles, settings, api_keys[]
- **Chat:** id, user_id, title, created_at, updated_at, messages[]
- **Message:** id, chat_id, sender, content, timestamp, model_used
- **APIKey:** id, user_id, provider, key_encrypted, created_at
- **Plugin:** id, name, description, config, owner_id

*Relationships: User has many Chats, Chats have many Messages, User has many APIKeys, Plugins can be global or user-specific.*

---

## Environment Setup

- **Backend:** Node.js (Express/NestJS), Python (FastAPI), or similar.
- **Frontend:** React (Next.js) or Vue.js.
- **Database:** PostgreSQL (primary), Redis (cache/session).
- **Storage:** Local (default), S3-compatible for cloud sync.
- **Dependencies:**  
  - LLM SDKs (OpenAI, Anthropic, Google, etc.)  
  - Auth libraries (JWT, OAuth)  
  - WebSocket for real-time collaboration  
  - Docker for containerization

**Setup Steps:**
1. Clone repo, install dependencies.
2. Set up `.env` with DB and secret keys.
3. Run migrations.
4. Start backend and frontend servers.
5. (Optional) Configure cloud sync/storage.

---

## Testing Guidelines

- **Unit Tests:** Core logic, API endpoints, provider integrations.
- **Integration Tests:** End-to-end chat flows, multi-provider switching.
- **UI Tests:** Accessibility, responsiveness, cross-browser.
- **Frameworks:** Jest, Cypress, Playwright.
- **Coverage:** Aim for 80%+ code coverage.

---

## Deployment Instructions

- **Environments:** dev, staging, production.
- **CI/CD:** GitHub Actions, GitLab CI, or similar.
- **Steps:**
  1. Build Docker images.
  2. Run tests.
  3. Deploy to cloud (AWS ECS, GCP Cloud Run, Azure App Service, or on-prem).
  4. Apply DB migrations.
  5. Monitor with logging/alerting tools.

---

## Version Control Practices

- **Branching:** GitFlow (main, develop, feature/*, bugfix/*, release/*).
- **Commits:** Conventional Commits (`feat:`, `fix:`, etc.).
- **Code Review:** PRs required, at least one reviewer.
- **Issue Tracking:** GitHub Issues/Projects or Jira.

---

## Security Practices

- API key encryption at rest.
- Role-based access control (RBAC) for admin/user separation.
- Input validation and sanitization.
- HTTPS everywhere.
- Regular dependency audits.
- No LLM training on user data unless explicitly enabled.

---

## Compliance Requirements

- **GDPR:** Right to access/delete data, data portability, consent management.
- **SOC2/ISO27001 (for enterprise):** Logging, access controls, incident response.
- **Data residency:** Option for EU/US/India storage as per user/org preference.

---

## Best Practices for Maintaining Knowledge Files

- **Start Early:** Draft and update this file from project inception.
- **Keep Dynamic:** Integrate with documentation generators and CI to auto-update API and schema docs.
- **Role Assignment:** Assign owners for each section (e.g., API docs, compliance, design).
- **Review Schedule:** Quarterly reviews to ensure accuracy.

---

*This living knowledge file will evolve as the project advances. For any updates, contributors should edit the relevant section and note changes in the version control system.*