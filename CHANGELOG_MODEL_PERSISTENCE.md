# Changelog: Model Selection Persistence

## Issue Fixed

The selected model was not persisting after a page refresh, always defaulting back to OpenRouter Anthropic. This update ensures that the user's model choice is saved and restored across sessions.

## Implementation Details

### 1. Persistence Logic

- **Logged-in Users:** The selected model and provider are now saved to the user's profile in the Supabase database. This is handled by the `saveToProfile` function in `modelPersistenceService.ts`.
- **Guest Users:** The selection is saved to the browser's `localStorage`. This is handled by the `saveToLocalStorage` function in `modelPersistenceService.ts`.

### 2. Loading Logic

- On application load, the `useModelSelection` hook attempts to load a saved model selection.
- It first checks for a selection in the user's profile (if logged in) and then falls back to `localStorage` (for guests).
- If a valid selection is found, it is set as the active model. Otherwise, the application falls back to a default model.

### 3. Code Refactoring

- **`useModelSelection.ts`:** This new hook centralizes all logic related to model selection persistence, including saving, loading, and clearing the selection.
- **`useAIProvider.ts`:** This hook now uses `useModelSelection` to manage the selected model and provider. It no longer contains its own state for this purpose.
- **`ModelSelector.tsx`:** This component has been simplified to be a presentational component. It receives the available models and the currently selected model as props and calls callback functions to handle model selection. It no longer fetches models or manages its own state.
- **Component Prop Drilling:** Props such as `availableModels`, `isLoadingModels`, and `modelError` are now passed down from `Index.tsx` through `Header.tsx` and `ProviderIconSelector.tsx` to `ModelSelector.tsx`.

## Testing Checklist

- [x] **Guest User:** Selected model persists after page reload.
- [x] **Logged-in User:** Selected model persists after page reload, logout, and login.
- [x] **Fallback:** The application correctly falls back to the default model when no selection is saved.

## Modified Files

- `src/hooks/useModelSelection.ts` (New)
- `src/services/modelPersistenceService.ts` (Updated)
- `src/hooks/useAIProvider.ts` (Updated)
- `src/components/ModelSelector.tsx` (Updated)
- `src/pages/Index.tsx` (Updated)
- `src/components/Header.tsx` (Updated)
- `src/components/ProviderIconSelector.tsx` (Updated)