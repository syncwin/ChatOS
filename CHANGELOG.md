# CHANGELOG

## [Unreleased]

### Added
- **PDF Export**: Complete overhaul with HTML rendering, input/output separation, ChatOS logo integration, enhanced styling, `html2pdf.js` integration, metadata exclusion, and error handling
- **Share Button**: Comprehensive implementation with URL generation, clipboard integration, toast notifications, and error handling
- **Message Edit Feature**: Complete implementation allowing users to edit their messages and regenerate AI responses
  - Edit button for user messages with pencil icon
  - Inline editing with textarea and save/cancel buttons
  - Automatic regeneration of AI response after message edit
  - Proper state management for editing mode
  - Integration with existing chat flow and streaming responses

### Enhanced
- **html2pdf.js Integration**: Advanced PDF generation with configurable options for better output quality
- **Message Edit Feature Improvements**:
  - **Icon Placement**: Moved edit icon for user messages to the left side, aligned with chat bubble width
  - **Editor Interface**: Redesigned editor to match input area styling with shadcn/ui components
    - Editor width matches chat bubble max width for visual consistency
    - Background, border, and text styling matches original input field
    - Improved contrast and padding for better text visibility
  - **UX Consistency**: Edit icon below assistant messages now triggers edit of previous user message
  - **Enhanced Controls**: Improved Send and Cancel button styling with hover states
  - **Keyboard Accessibility**: Ctrl+Enter to save, Escape to cancel
  - **Visual Feedback**: Ring highlighting when editing with proper focus management
  - **ARIA Labels**: Enhanced accessibility with descriptive labels

### Fixed
- **TypeScript Errors**: Resolved all TypeScript compilation errors related to `suggestedQuestions`
  - Added `suggestedQuestions` property to `ChatViewProps` interface
  - Defined `suggestedQuestions` constant in Index.tsx
  - Ensured type-safe usage across all components
  - Verified successful TypeScript compilation with `tsc --noEmit`
  - Implemented auto-scroll to input area when editing
  - Improved ARIA labels and accessibility support
  - Added auto-focus to edit textarea

### Fixed
- **PDF Export Blank File Issue**: Enhanced markdown-to-HTML conversion with proper content validation, improved rendering timing, and better DOM element handling
- **TypeScript Error**: Resolved "no overlap in comparison" error in ChatMessage.tsx by fixing redundant role condition checks

## Perfect PDF Export & Share Button Copy

Implemented comprehensive improvements to PDF export functionality and share button behavior according to user requirements.

### PDF Export Improvements
- **HTML Rendering**: All content now renders as proper HTML in PDF (not markdown)
  - Added markdown-to-HTML converter for clean formatting
  - Applied CSS styles for headings, lists, code blocks, and links
- **Input/Output Separation**: Clear visual distinction between user questions and AI answers
  - User messages styled with blue theme and "Question" label
  - AI messages styled with gray theme and "Answer" label
  - Distinct background colors and borders for each message type
- **ChatOS Logo Integration**: 
  - Added ChatOS logo at the top of PDF using base64-encoded SVG
  - Logo displays correctly with gradient colors (#3f00ff to #ff8000)
  - Proper sizing and positioning in PDF header
- **Enhanced Styling**: 
  - Modern typography with Segoe UI font family
  - Professional layout with proper spacing and margins
  - Code syntax highlighting with monospace fonts
  - Responsive design elements for better readability
- **html2pdf.js Integration**: 
  - Replaced basic print dialog with proper PDF generation
  - High-quality output with 2x scaling and JPEG compression
  - A4 format with consistent margins
  - Automatic file naming: `chatOS-message-{id}.pdf`
- **Metadata Exclusion**: Removed provider, model, and timestamp information from PDF output

### Share Button Enhancement
- **Direct Clipboard Copy**: Share button now copies chat URL directly to clipboard
- **No Window Opening**: Removed new window/tab opening behavior
- **Improved UX**: 
  - "Link copied!" confirmation toast notification
  - Error handling with descriptive messages
  - Faster, more reliable sharing experience

### Technical Implementation
- Added `html2pdf.js` import for professional PDF generation
- Created `markdownToHtml()` helper function for content conversion
- Implemented proper HTML entity decoding in PDF export
- Enhanced error handling and user feedback
- Maintained backward compatibility with existing functionality

## Clean Markdown Generation with HTML Entity Decoding

Implemented comprehensive HTML entity decoding system to generate clean, readable Markdown from raw text with proper handling of all special characters and encoding formats.

### Changes Made

#### New HTML Entity Decoding System
- **Added `he` library** for reliable HTML entity decoding
- **Created `decodeHtmlEntities` utility function** in `src/lib/utils.ts`
- **Comprehensive character handling:**
  - All HTML entities using the 'he' library (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&nbsp;`, etc.)
  - Unicode escape sequences (`\uXXXX`)
  - Hex character codes (`&#xXX;` or `&#XXX;`)
  - Decimal character codes (`&#XXX;`)
  - Line ending normalization (`\r\n`, `\r` → `\n`)
  - Special Unicode spaces (non-breaking, thin, hair spaces)
  - Line and paragraph separators (`\u2028`, `\u2029`)

#### ChatMessage.tsx
- **Updated copy functionality** to use new `decodeHtmlEntities` utility
- **Simplified implementation** with centralized decoding logic
- **Maintained toast notifications** and fallback support
- **Ensures clean Markdown output** without raw HTML entities or Unicode codes

#### ChatActionIcons.tsx
- **Updated Markdown export** to use `decodeHtmlEntities` utility
- **Updated PDF export** to use decoded content for clean output
- **Consistent character handling** across all export formats

#### Testing & Documentation
- **Created comprehensive test suite** (`src/tests/htmlEntityDecoding.test.ts`)
- **Manual test cases** for visual verification
- **Documented decoding workflow** for future maintenance
- **Test coverage** for various special characters (`'`, `"`, `&`, `<`, `>`, etc.)

### Technical Implementation
- **Reliable library usage:** Uses `he` library for standard HTML entity decoding
- **Comprehensive coverage:** Handles all common encoding scenarios
- **Reusable utility:** Centralized function for consistent behavior across components
- **Performance optimized:** Efficient processing with minimal overhead
- **Future-proof:** Easily extensible for new encoding requirements

---

## Version: Remove Cost Display & Improve Copy Functionality
**Date:** December 2024

### 🎯 Overview
Removed cost display from frontend UI and enhanced copy functionality to ensure proper Markdown formatting with special character handling.

---

## ✅ Cost Display Removal

### Changes Made:
- **File Modified:** `src/components/ChatActionIcons.tsx`
- **Implementation:** Removed cost calculation display from provider tooltip
- **Details:**
  - Removed cost display line from provider tooltip
  - Maintained token usage information (input, output, total tokens)
  - Left backend cost calculation logic unchanged for future use
  - Preserved all other tooltip functionality

### Functionality:
- ✅ Cost information completely removed from frontend UI
- ✅ Token usage information still displayed
- ✅ Provider and model information preserved
- ✅ Backend cost calculation logic maintained
- ✅ No impact on other UI elements or functionality

---

## ✅ Enhanced Copy Functionality

### Changes Made:
- **File Modified:** `src/components/ChatMessage.tsx`
- **Implementation:** Enhanced copy function with proper Markdown formatting and special character handling
- **Details:**
  - Added HTML entity decoding (e.g., `&amp;` → `&`, `&lt;` → `<`)
  - Added Unicode escape sequence handling
  - Normalized line endings for cross-platform compatibility
  - Added toast notifications for copy confirmation
  - Implemented fallback copy method for older browsers
  - Added comprehensive error handling

### Special Character Handling:
- **HTML Entities:** `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&nbsp;`
- **Unicode Sequences:** `\uXXXX` format conversion
- **Line Endings:** Normalized `\r\n` and `\r` to `\n`
- **Preserves:** Markdown formatting, code blocks, and special syntax

### Functionality:
- ✅ Copies content in proper Markdown format
- ✅ Converts HTML entities to normal display form
- ✅ Handles Unicode escape sequences correctly
- ✅ Shows toast notification confirming successful copy
- ✅ Fallback support for older browsers
- ✅ Comprehensive error handling
- ✅ Maintains visual copy state indicator

### Technical Implementation:
- Enhanced `handleCopy` function with async/await pattern
- Added `useToast` hook integration for notifications
- Implemented regex-based character normalization
- Added fallback using `document.execCommand` for compatibility
- Comprehensive error logging for debugging

---

## Version: Free Model Cost Display Feature
**Date:** December 2024

### 🎯 Overview
Implemented free model detection and cost display feature to show $0.00 for free models instead of calculated costs.

---

## ✅ Free Model Cost Display

### Changes Made:
- **File Modified:** `src/components/ChatActionIcons.tsx`
- **Implementation:** Enhanced cost calculation logic with free model detection
- **Details:**
  - Added comprehensive free model lists for multiple providers
  - Implemented pattern matching for free model identification
  - Added support for free provider detection
  - Enhanced cost display formatting for better user experience

### Free Models Supported:
- **OpenAI:** `gpt-3.5-turbo-free`, `gpt-4o-mini-free`
- **Google/Gemini:** `gemini-1.5-flash-free`, `gemini-pro-free`, `gemini-flash-free`
- **Anthropic:** `claude-3-haiku-free`
- **OpenRouter:** `openrouter/free`, `free/gpt-3.5-turbo`
- **Development/Testing:** `test-model`, `demo-model`, `playground-model`
- **Generic Patterns:** `free-gpt`, `free-claude`, `free-gemini`

### Free Providers Supported:
- `free`, `demo`, `playground`, `test`

### Functionality:
- ✅ Detects free models by name pattern matching
- ✅ Detects free providers by name pattern matching
- ✅ Returns $0.00 cost for all free models/providers
- ✅ Maintains existing cost calculation for paid models
- ✅ Improved cost display format (shows "$0.00" instead of "$0.000000")
- ✅ Case-insensitive matching for robust detection
- ✅ Supports partial string matching for flexible model naming

### Technical Implementation:
- Added `freeModels` array with comprehensive free model patterns
- Added `freeProviders` array for free provider detection
- Enhanced `calculateCost` function with free model logic
- Improved cost formatting in provider tooltip display
- Maintains backward compatibility with existing cost calculation

---

## Version: Critical UX & Mobile Header Fixes
**Date:** December 2024

### 🎯 Overview
Implemented critical UX improvements focusing on chat persistence, selection indicator consistency, and mobile header usability.

---

## ✅ 1. Chat Persistence on Page Reload

### Changes Made:
- **File Modified:** `src/hooks/useChat.ts`
- **Implementation:** Added localStorage persistence for authenticated users
- **Details:**
  - Added `useEffect` hook to load `activeChatId` from localStorage on component mount
  - Added `useEffect` hook to save `activeChatId` to localStorage whenever it changes
  - Maintains existing sessionStorage logic for guest users
  - Uses `ACTIVE_CHAT_ID_KEY = 'chatos-active-chat-id'` as storage key

### Functionality:
- ✅ Currently open chat remains open after page reload
- ✅ Active chat ID saved to localStorage for authenticated users
- ✅ Active chat ID saved to sessionStorage for guest users
- ✅ Automatic restoration of last active chat on page load
- ✅ Defaults to first chat only if no previous chat is saved

---

## ✅ 2. Selection Indicator Size & Color Consistency

### Global Styles Added:
- **File Modified:** `src/index.css`
- **CSS Variables Added:**
  ```css
  --selection-indicator-size: 0.625rem; /* 10px */
  --selection-indicator-position: -0.125rem; /* -2px */
  ```
- **CSS Classes Added:**
  - `.selection-indicator` - For simple indicators
  - `.selection-indicator-with-number` - For indicators with numbers

### Component Updates:

#### ProviderIconSelector.tsx
- ✅ Updated to use `.selection-indicator` class
- ✅ Removed custom sizing and positioning
- ✅ Uses consistent primary color

#### FolderDropdown.tsx
- ✅ Updated to use `.selection-indicator` class
- ✅ Standardized size and positioning
- ✅ Uses consistent primary color

#### TagDropdown.tsx
- ✅ Updated to use `.selection-indicator-with-number` class
- ✅ Maintains tag count display for multiple tags
- ✅ Improved text sizing and spacing
- ✅ Uses consistent primary color

### Results:
- ✅ All indicators are small, uniform in size, and visually unobtrusive
- ✅ Consistent primary color `#3f00ff` used across all indicators
- ✅ Number badges are properly sized and centered
- ✅ No cramped or cropped numbers

---

## ✅ 3. Mobile Header: Unified Selection Modal

### New Component Created:
- **File Created:** `src/components/MobileSelectionModal.tsx`
- **Features:**
  - Single modal for all mobile selections
  - Provider/Model selection section
  - Folder assignment section
  - Tag assignment section
  - Touch-optimized interface
  - Easy close functionality

### Header Integration:
- **File Modified:** `src/components/Header.tsx`
- **Changes:**
  - Added `useIsMobile` hook integration
  - Added `MobileSelectionModal` import
  - Implemented conditional rendering:
    - Mobile: Shows single settings icon + unified modal
    - Desktop: Shows individual selectors (ProviderIconSelector, FolderDropdown, TagDropdown)

### Mobile Styles:
- **File Modified:** `src/index.css`
- **Added mobile-specific optimizations:**
  ```css
  .mobile-selection-modal {
    width: 95vw;
    max-width: 28rem;
    margin: 0 auto;
  }
  .mobile-selection-section {
    padding: 1rem 0;
  }
  ```

### Results:
- ✅ Single settings icon on mobile header (right side)
- ✅ Unified modal for all selections (model, folder, tags)
- ✅ Clean mobile header with removed individual selectors
- ✅ Touch-optimized and user-friendly modal
- ✅ Easy modal close functionality

---

## 🔧 Technical Implementation Details

### File Structure:
```
src/
├── hooks/
│   └── useChat.ts (modified - chat persistence)
├── components/
│   ├── Header.tsx (modified - mobile integration)
│   ├── ProviderIconSelector.tsx (modified - indicator consistency)
│   ├── FolderDropdown.tsx (modified - indicator consistency)
│   ├── TagDropdown.tsx (modified - indicator consistency)
│   └── MobileSelectionModal.tsx (new - unified mobile modal)
└── index.css (modified - global styles and mobile optimizations)
```

### Dependencies Used:
- Existing UI components (Dialog, Button, Badge, etc.)
- Existing hooks (useIsMobile, useChat)
- Existing icons (Settings, Bot, Folder, Tag)
- No new external dependencies added

### Responsive Breakpoints:
- Mobile: `max-width: 767px` (uses unified modal)
- Desktop: `min-width: 768px` (uses individual selectors)
- Tablet optimizations: `768px - 1023px`
- Small screen optimizations: `max-width: 480px`

---

## ✅ Quality Assurance

### Code Quality:
- ✅ Clean, modular, and reusable code
- ✅ Follows existing project conventions
- ✅ No code duplication
- ✅ Proper TypeScript typing
- ✅ Consistent naming conventions

### Integration:
- ✅ Seamless integration with existing codebase
- ✅ No breaking changes to existing functionality
- ✅ Maintains all existing UI and functions
- ✅ Backward compatible

### Testing Checklist:
- ✅ Chat persistence works on page reload
- ✅ Selection indicators are consistent across components
- ✅ Mobile modal functions properly on touch devices
- ✅ Desktop layout remains unchanged
- ✅ All responsive breakpoints work correctly

---

## 📋 Implementation Summary

**Total Files Modified:** 6
**Total Files Created:** 2 (MobileSelectionModal.tsx, CHANGELOG.md)
**Breaking Changes:** None
**New Dependencies:** None

**Key Achievements:**
1. ✅ Chat persistence implemented for both authenticated and guest users
2. ✅ Unified selection indicator system with consistent sizing and colors
3. ✅ Mobile-first unified selection modal for improved UX
4. ✅ Responsive design maintained across all breakpoints
5. ✅ Zero breaking changes to existing functionality

All requirements from the original checklist have been successfully implemented and tested.