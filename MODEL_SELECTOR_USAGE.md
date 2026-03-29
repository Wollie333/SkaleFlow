# LLM Model Selector - Usage Guide

## Overview

The LLM Model Selector allows users to choose their preferred AI model from the header. The selected model is automatically used for all AI generations across the platform.

## Components

### 1. Model Context (`contexts/model-context.tsx`)

Provides the selected model state globally across the app.

```tsx
import { useModel } from '@/contexts/model-context';

function MyComponent() {
  const { selectedModel, setSelectedModel, availableModels, isLoading } = useModel();

  // selectedModel - currently selected model ID
  // availableModels - array of available models
  // isLoading - whether models are being fetched
}
```

### 2. Selected Model Hook (`hooks/useSelectedModel.ts`)

Simplified hook for components that only need the selected model ID:

```tsx
import { useSelectedModel } from '@/hooks/useSelectedModel';

function MyComponent() {
  const { selectedModelId } = useSelectedModel();

  // Use selectedModelId in your API calls
}
```

### 3. API Endpoint (`/api/models/enabled`)

Returns all enabled models for the current user:

```bash
GET /api/models/enabled
```

Response:
```json
{
  "models": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "provider": "openai",
      "isFree": false
    },
    {
      "id": "claude-3-5-sonnet",
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "isFree": false
    }
  ]
}
```

## Usage in Components

### Frontend Component Example

```tsx
'use client';

import { useSelectedModel } from '@/hooks/useSelectedModel';
import { useState } from 'react';

export function ContentGenerator() {
  const { selectedModelId } = useSelectedModel();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Generate blog post about AI',
          modelId: selectedModelId, // ← Use the selected model
        }),
      });

      const data = await response.json();
      setContent(data.content);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </button>
      <div>{content}</div>
    </div>
  );
}
```

### API Route Example

```typescript
// app/api/content/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/generate';

export async function POST(request: NextRequest) {
  try {
    const { prompt, modelId } = await request.json();

    // Use the modelId from the request (selected by user in header)
    const result = await generateText({
      prompt,
      modelId, // ← Use the user-selected model
      // ... other options
    });

    return NextResponse.json({ content: result.text });
  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

### Server Action Example

```typescript
'use server';

import { generateText } from '@/lib/ai/generate';

export async function generateContent(prompt: string, modelId: string) {
  // modelId is passed from the client (from useSelectedModel hook)
  const result = await generateText({
    prompt,
    modelId,
  });

  return result.text;
}
```

## How It Works

1. **User selects model** - User clicks the model selector in the header and chooses their preferred AI model
2. **Model is stored** - Selected model ID is saved to localStorage and React context
3. **Components use model** - Components use `useSelectedModel()` hook to get the selected model ID
4. **API calls include model** - The model ID is sent in API requests
5. **Backend uses model** - API routes/server functions use the specified model for generation

## Migration Guide

### Updating Existing AI Generation Code

**Before:**
```typescript
// Old code that hardcoded the model
const result = await generateText({
  prompt: 'Generate content',
  modelId: 'gpt-4o', // ← Hardcoded
});
```

**After:**
```typescript
// New code that uses user-selected model
import { useSelectedModel } from '@/hooks/useSelectedModel';

function MyComponent() {
  const { selectedModelId } = useSelectedModel();

  const handleGenerate = async () => {
    const result = await generateText({
      prompt: 'Generate content',
      modelId: selectedModelId, // ← User's choice
    });
  };
}
```

## Best Practices

1. **Always use the hook** - Use `useSelectedModel()` instead of hardcoding model IDs
2. **Pass model to API** - Always include the selected model ID in your API requests
3. **Fallback handling** - Handle cases where no model is selected (though the context provides a default)
4. **Server-side validation** - Validate that the requested model is enabled before using it

## Testing

To test the model selector:

1. Login to the dashboard
2. Look for the AI model selector in the header (left of the theme toggle)
3. Click it to see available models
4. Select a different model
5. Perform an AI generation - it should use the selected model
6. Check browser localStorage - `skaleflow_selected_model` should contain your selection
7. Refresh the page - your selection should persist

## Admin Controls

Admins can enable/disable models at `/admin/costs`:

- Disabled models won't appear in the user's model selector
- Users with a disabled model selected will automatically fall back to the first available model
