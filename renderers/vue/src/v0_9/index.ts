/**
 * @a2ui/vue v0.9 - Vue renderer for A2UI
 *
 * Public API surface for the v0.9 renderer.
 * Copyright 2026 Google LLC
 */

// Core adapter
export {createComponentImplementation, createBinderlessComponentImplementation} from './adapter';

// Types
export type {
  VueComponentImplementation,
  VueA2uiComponentProps,
  ResolveVueProps,
} from './types';

// Surface rendering
export {DeferredChild, A2uiSurface} from './A2uiSurface';

// Composable
export {useA2uiRenderer} from './composables/useA2uiRenderer';
export type {UseA2uiRendererReturn} from './composables/useA2uiRenderer';

// Basic catalog
export {basicCatalog} from './catalog/basic';

// Re-export useful web_core types for convenience
export {
  Catalog,
  MessageProcessor,
  ComponentContext,
  type ComponentApi,
  type SurfaceModel,
  type SurfaceGroupModel,
  type ComponentModel,
  type A2uiClientMessage,
} from '@a2ui/web_core/v0_9';

// Re-export basic catalog APIs for custom catalog builders
export {
  TextApi,
  ImageApi,
  IconApi,
  VideoApi,
  AudioPlayerApi,
  RowApi,
  ColumnApi,
  ListApi,
  CardApi,
  TabsApi,
  DividerApi,
  ModalApi,
  ButtonApi,
  TextFieldApi,
  CheckBoxApi,
  ChoicePickerApi,
  SliderApi,
  DateTimeInputApi,
  BASIC_FUNCTIONS,
} from '@a2ui/web_core/v0_9/basic_catalog';
