# ChatOS Testing Checklist

This comprehensive checklist ensures all functionality works correctly in both guest and authenticated user modes before deployment.

## Pre-Testing Setup

### Environment Verification
- [ ] Development server running on `http://localhost:8080`
- [ ] `.env.local` file exists with correct Supabase configuration
- [ ] Environment variables loading correctly (check console)
- [ ] Browser DevTools open for monitoring console logs
- [ ] Network tab available for API call inspection
- [ ] At least one AI provider API key available for testing

### Test Data Preparation
- [ ] Valid API keys for at least 2 different providers
- [ ] Test messages of varying lengths (short, medium, long)
- [ ] Special characters and markdown content for testing
- [ ] Multiple browser tabs/windows for session testing

---

## Guest User Flow Testing

### Initial Access
- [ ] Navigate to `http://localhost:8080`
- [ ] Auth page loads correctly
- [ ] "Continue as Guest" button is visible and functional
- [ ] Click "Continue as Guest" redirects to main application
- [ ] Guest mode indicator visible in UI

### Guest API Key Management
- [ ] Access Settings dialog (gear icon in sidebar)
- [ ] API Key Management section is visible
- [ ] "Add API Key" form is functional
- [ ] Can select different providers from dropdown
- [ ] Can enter API key in text field
- [ ] Form validation works (empty key, invalid format)
- [ ] Successfully add API key for OpenAI
- [ ] Successfully add API key for Anthropic (if available)
- [ ] API keys appear in the list after adding
- [ ] Can delete API keys using delete button
- [ ] Security warning message is displayed
- [ ] API keys are encrypted in sessionStorage (check DevTools > Application > Session Storage)
- [ ] Session ID is generated and stored
- [ ] Keys are not visible in plain text in storage

### Guest Chat Functionality
- [ ] Provider selector shows added providers
- [ ] Can select different AI providers
- [ ] Model selector updates based on selected provider
- [ ] Can create new chat
- [ ] Chat appears in sidebar
- [ ] Can send message to AI and receive response
    - [ ] Error handling for invalid API key works as expected
    - [ ] Network errors are handled gracefully (e.g., with retry logic)
- [ ] Message formatting (markdown) works correctly
- [ ] Code blocks are syntax highlighted
- [ ] Can copy AI responses
- [ ] Streaming responses work (OpenAI)
- [ ] Can switch providers mid-conversation
- [ ] Can switch models mid-conversation

### Guest Session Management
- [ ] API keys persist during browser session
- [ ] Chats persist during browser session
- [ ] Refresh page - data remains
- [ ] Open new tab - guest mode continues
- [ ] Close all tabs and reopen - session data cleared
- [ ] sessionStorage contains encrypted API keys
- [ ] No sensitive data in localStorage

### Guest Limitations
- [ ] Cannot access user profile settings
- [ ] Cannot save data permanently
- [ ] Security warnings are displayed appropriately
- [ ] Guest mode clearly indicated in UI

---

## Authenticated User Flow Testing

### User Registration
- [ ] Navigate to auth page
- [ ] Click "Sign Up" tab
- [ ] Enter valid email and password
- [ ] Form validation works (invalid email, weak password)
- [ ] Registration successful
- [ ] Email verification sent (check email)
- [ ] Can verify email and complete registration
- [ ] Redirected to main application after verification

### User Login
- [ ] Navigate to auth page
- [ ] Enter registered email and password
- [ ] Login successful
- [ ] Redirected to main application
- [ ] User profile information loaded
- [ ] Previous chats and data restored (if any)

### Authenticated API Key Management
- [ ] Access Settings dialog
- [ ] API Key Management section available
- [ ] Can add API keys for multiple providers
- [ ] API keys are saved to database
- [ ] Can edit existing API keys
- [ ] Can delete API keys
- [ ] API keys persist across sessions
- [ ] No security warnings (vs guest mode)

### Authenticated Chat Functionality
- [ ] All guest functionality works
- [ ] Chats are saved to database
- [ ] Chat history persists across sessions
- [ ] Can organize chats in folders
- [ ] Can add tags to chats
- [ ] Can pin important chats
- [ ] Can search through chat history
- [ ] Can export chat data

### Profile Management
- [ ] Access user profile dialog
- [ ] Can update display name
- [ ] Can upload/change avatar
- [ ] Can change theme preferences
- [ ] Profile changes are saved
- [ ] Profile data persists across sessions

### Data Persistence
- [ ] Logout and login - all data restored
- [ ] Close browser and reopen - data persists
- [ ] Multiple devices - data syncs
- [ ] API keys remain secure and functional

---

## Cross-Mode Testing

### Guest to Authenticated Migration
- [ ] Start in guest mode
- [ ] Add API keys and create chats
- [ ] Sign up/login while in guest mode
- [ ] Guest data handling (preserved/migrated/cleared)
- [ ] API keys migration behavior
- [ ] No data loss or corruption

### Authenticated to Guest Transition
- [ ] Start logged in
- [ ] Logout to auth page
- [ ] Switch to guest mode
- [ ] Previous authenticated data not accessible
- [ ] Guest mode works independently
- [ ] No data leakage between modes

---

## Security Testing

### Guest Mode Security
- [ ] **Encryption Verification**:
  - [ ] API keys are encrypted with AES-256-GCM
  - [ ] Encrypted keys are base64 encoded in sessionStorage
  - [ ] Session ID is unique per browser session
  - [ ] Encryption key is derived from session ID + salt

- [ ] **Storage Security**:
  - [ ] Keys stored in sessionStorage (not localStorage)
  - [ ] Keys prefixed with `guest_api_key_` pattern
  - [ ] No plain text API keys visible in browser storage
  - [ ] Session ID stored as `chat_session_id`

- [ ] **Auto-cleanup Testing**:
  - [ ] Keys cleared on page refresh/reload
  - [ ] Keys cleared when tab is closed
  - [ ] Keys cleared when browser is closed
  - [ ] Keys cleared on 30-minute inactivity timeout
  - [ ] Keys cleared when switching to authenticated mode
  - [ ] Keys cleared when tab becomes hidden (test with tab switching)

- [ ] **Session Timeout**:
  - [ ] Inactivity timer resets on user interaction
  - [ ] Console message appears when session expires
  - [ ] All guest keys are cleared after timeout
  - [ ] User is notified about session expiration

### Authenticated Mode Security
- [ ] **Database Security**:
  - [ ] API keys stored in Supabase database
  - [ ] Row Level Security (RLS) policies active
  - [ ] Users can only access their own keys
  - [ ] JWT authentication required for all operations

- [ ] **Access Control**:
  - [ ] Cannot access other users' API keys
  - [ ] Database queries filtered by user ID
  - [ ] Proper error messages for unauthorized access
  - [ ] Session validation on each request

### Environment Security
- [ ] **Environment Variables**:
  - [ ] No hardcoded Supabase keys in source code
  - [ ] Environment variables loaded correctly
  - [ ] `.env.local` file not committed to git
  - [ ] Fallback values work if env vars missing

- [ ] **API Security**:
  - [ ] HTTPS used for all Supabase communications
  - [ ] API keys never logged in console (production)
  - [ ] Proper error handling without exposing secrets
  - [ ] Rate limiting respected

### Cross-Mode Security
- [ ] **Mode Switching**:
  - [ ] Guest keys cleared when logging in
  - [ ] No guest data persists after authentication
  - [ ] Authenticated keys not accessible in guest mode
  - [ ] Clean separation between modes

---

### AI Provider Testing

- **Dynamic Model Fetching**:
  - [ ] Verify that the model list is dynamically fetched for the selected provider.
  - [ ] Test with a provider that has no available models and verify that a message is displayed.
- **Gemini Provider**:
  - [ ] Test with an invalid Gemini API key and verify that a specific error message is displayed.
  - [ ] Test with a valid Gemini API key and verify that a chat session can be started.

### OpenAI Integration
- [ ] API key validation
- [ ] Model selection (gpt-4o-mini, gpt-4o, etc.)
- [ ] Standard chat responses
- [ ] Streaming responses
- [ ] Error handling (invalid key, rate limits)
- [ ] Usage tracking and display

### Anthropic Integration
- [ ] API key validation
- [ ] Model selection (Claude variants)
- [ ] Chat responses with system messages
- [ ] Error handling
- [ ] Usage tracking

### Google Gemini Integration
- [ ] API key validation
- [ ] Model selection (Gemini variants)
- [ ] Chat responses
- [ ] Error handling
- [ ] Usage tracking

### Mistral Integration
- [ ] API key validation
- [ ] Model selection
- [ ] Chat responses
- [ ] Error handling
- [ ] Usage tracking

### OpenRouter Integration
- [ ] API key validation
- [ ] Multiple model access
- [ ] Chat responses
- [ ] Error handling
- [ ] Usage tracking

---

## UI/UX Testing

### Responsive Design
- [ ] Desktop view (1920x1080)
- [ ] Laptop view (1366x768)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Sidebar collapse/expand
- [ ] Message layout adaptation
- [ ] Settings dialog responsiveness

### Theme and Accessibility
- [ ] Dark theme (default)
- [ ] Light theme switching
- [ ] High contrast mode
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus indicators
- [ ] Color contrast ratios

### Performance
- [ ] Initial page load time
- [ ] Chat creation speed
- [ ] Message sending responsiveness
- [ ] Large chat history handling
- [ ] Memory usage during long sessions
- [ ] Network request optimization

---

## Security Testing

### Guest Mode Security
- [ ] API keys encrypted in sessionStorage
- [ ] No plain text API keys in browser storage
- [ ] Session isolation between tabs
- [ ] Data cleared on session end
- [ ] No persistent sensitive data
- [ ] Security warnings displayed

### Authenticated Mode Security
- [ ] API keys encrypted in database
- [ ] User data isolation (RLS)
- [ ] Secure authentication flow
- [ ] Session management
- [ ] Input validation and sanitization
- [ ] XSS protection
- [ ] CSRF protection

### API Security
- [ ] API key validation
- [ ] Rate limiting
- [ ] Error message sanitization
- [ ] No sensitive data in logs
- [ ] Secure communication (HTTPS)

---

## Error Handling Testing

### Network Errors
- [ ] Offline mode handling
- [ ] Slow network conditions
- [ ] API timeout handling
- [ ] Connection retry logic
- [ ] User-friendly error messages

### API Errors
- [ ] Invalid API key handling
- [ ] Rate limit exceeded
- [ ] Insufficient credits
- [ ] Model unavailable
- [ ] Malformed requests

### Application Errors
- [ ] JavaScript errors
- [ ] React component errors
- [ ] State management errors
- [ ] Routing errors
- [ ] Storage errors

---

## Browser Compatibility

### Chrome
- [ ] Latest version functionality
- [ ] Guest mode works
- [ ] Authenticated mode works
- [ ] All features functional

### Firefox
- [ ] Latest version functionality
- [ ] Guest mode works
- [ ] Authenticated mode works
- [ ] All features functional

### Safari
- [ ] Latest version functionality
- [ ] Guest mode works
- [ ] Authenticated mode works
- [ ] All features functional

### Edge
- [ ] Latest version functionality
- [ ] Guest mode works
- [ ] Authenticated mode works
- [ ] All features functional

---

## Performance Benchmarks

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Chat creation < 1 second
- [ ] Message sending < 2 seconds
- [ ] Provider switching < 1 second

### Resource Usage
- [ ] Memory usage stable during long sessions
- [ ] No memory leaks detected
- [ ] CPU usage reasonable
- [ ] Network requests optimized

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Code formatting consistent
- [ ] No console.log statements in production
- [ ] Error boundaries implemented

### Security Review
- [ ] No hardcoded secrets in client code
- [ ] API keys properly encrypted
- [ ] User input sanitized
- [ ] Authentication flows secure
- [ ] HTTPS enforced

### Documentation
- [ ] README.md updated
- [ ] DEVELOPMENT_SETUP.md complete
- [ ] API documentation current
- [ ] Deployment guide available

### Testing Coverage
- [ ] All critical paths tested
- [ ] Both user modes verified
- [ ] All AI providers tested
- [ ] Error scenarios covered
- [ ] Performance acceptable

---

## Test Results Template

```
Testing Session: [Date/Time]
Tester: [Name]
Browser: [Browser/Version]
OS: [Operating System]

## Guest Mode Results
- API Key Management: ✅/❌
- Chat Functionality: ✅/❌
- Session Management: ✅/❌
- Security: ✅/❌

## Authenticated Mode Results
- Registration/Login: ✅/❌
- API Key Management: ✅/❌
- Chat Functionality: ✅/❌
- Data Persistence: ✅/❌

## AI Providers Tested
- OpenAI: ✅/❌
- Anthropic: ✅/❌
- Gemini: ✅/❌
- Mistral: ✅/❌
- OpenRouter: ✅/❌

## Issues Found
1. [Description]
2. [Description]

## Overall Status
- Ready for deployment: ✅/❌
- Requires fixes: ✅/❌
```

---

**Testing Complete!** ✅

Once all items are checked and any issues resolved, the application is ready for deployment with confidence that both guest and authenticated user flows work correctly.