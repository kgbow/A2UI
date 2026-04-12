/**
 * @a2ui/vue - useA2uiRenderer composable
 *
 * Provides a convenient Vue composable for initializing and using
 * the A2UI renderer with Vue reactivity.
 *
 * Copyright 2026 Google LLC
 */

import {ref, onUnmounted, type Ref} from 'vue';
import {
  MessageProcessor,
  Catalog,
  SurfaceGroupModel,
  type SurfaceModel,
  type A2uiClientMessage,
} from '@a2ui/web_core/v0_9';
import type {VueComponentImplementation} from '../types';

export interface UseA2uiRendererReturn {
  /** Process incoming A2UI messages from the agent. */
  processMessages: (messages: A2uiClientMessage[]) => void;
  /** Reactive map of surface IDs to their SurfaceModel instances. */
  surfaces: Ref<Map<string, SurfaceModel<VueComponentImplementation>>>;
  /** The underlying SurfaceGroupModel for advanced usage. */
  surfaceGroup: SurfaceGroupModel<VueComponentImplementation>;
  /** Subscribe to user actions dispatched from surfaces. */
  onAction: (handler: (action: any) => void) => () => void;
}

/**
 * Vue composable that wraps the A2UI MessageProcessor.
 *
 * @param catalogs - Array of Catalog instances (e.g., basicCatalog)
 * @returns Reactive A2UI renderer state and methods
 *
 * @example
 * ```vue
 * <script setup>
 * import { useA2uiRenderer } from '@a2ui/vue/v0_9';
 * import { basicCatalog } from '@a2ui/vue/v0_9';
 *
 * const { processMessages, surfaces, onAction } = useA2uiRenderer([basicCatalog]);
 *
 * onAction((action) => {
 *   console.log('User action:', action);
 *   // Send to your agent backend
 * });
 * </script>
 * ```
 */
export function useA2uiRenderer(
  catalogs: Catalog<VueComponentImplementation>[],
): UseA2uiRendererReturn {
  const surfaces = ref(
    new Map<string, SurfaceModel<VueComponentImplementation>>(),
  ) as Ref<Map<string, SurfaceModel<VueComponentImplementation>>>;

  const processor = new MessageProcessor<VueComponentImplementation>(catalogs);

  // Subscribe to surface lifecycle
  const unsubCreated = processor.model.onSurfaceCreated.subscribe(surface => {
    surfaces.value = new Map([...surfaces.value, [surface.id, surface]]);
  });

  const unsubDeleted = processor.model.onSurfaceDeleted.subscribe(surfaceId => {
    const newMap = new Map(surfaces.value);
    newMap.delete(surfaceId);
    surfaces.value = newMap;
  });

  onUnmounted(() => {
    unsubCreated.unsubscribe();
    unsubDeleted.unsubscribe();
    // MessageProcessor does not have dispose, just clean up subscriptions
  });

  const onAction = (handler: (action: any) => void) => {
    const sub = processor.model.onAction.subscribe(handler);
    return () => sub.unsubscribe();
  };

  return {
    processMessages: (messages: A2uiClientMessage[]) =>
      processor.processMessages(messages),
    surfaces,
    surfaceGroup: processor.model,
    onAction,
  };
}
