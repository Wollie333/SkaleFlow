import { useModel } from '@/contexts/model-context';

/**
 * Hook to get the currently selected model ID for AI generation
 * Use this in any component that needs to make AI generation API calls
 *
 * Example usage:
 * ```tsx
 * const { selectedModelId } = useSelectedModel();
 *
 * // In your API call:
 * const response = await fetch('/api/generate', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     prompt: 'Generate content...',
 *     modelId: selectedModelId, // Use the selected model
 *   })
 * });
 * ```
 */
export function useSelectedModel() {
  const { selectedModel, availableModels, isLoading } = useModel();

  return {
    selectedModelId: selectedModel,
    availableModels,
    isLoading,
  };
}
