/**
 * @a2ui/vue - Vue renderer for A2UI (Agent-to-User Interface)
 *
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import type {Component, VNode} from 'vue';
import type {ComponentApi, ComponentContext} from '@a2ui/web_core/v0_9';
import type {ResolveA2uiProps} from '@a2ui/web_core/v0_9';

/**
 * Vue-specific component implementation that extends ComponentApi with a Vue component.
 */
export interface VueComponentImplementation extends ComponentApi {
  /** The Vue component that renders this A2UI component. */
  component: Component;
}

/**
 * Props passed to every Vue A2UI component.
 */
export type VueA2uiComponentProps<T = any> = {
  /** Fully resolved reactive props from the GenericBinder. */
  props: T;
  /** Function to render a child component by ID. */
  buildChild: (id: string, basePath?: string) => VNode | null;
  /** The component context providing access to the data model and surface. */
  context: ComponentContext;
};

/**
 * Type helper: maps a ComponentApi to its resolved Vue component props.
 */
export type ResolveVueProps<Api extends ComponentApi> = VueA2uiComponentProps<
  ResolveA2uiProps<InferSchema<Api>>
>;

type InferSchema<Api extends ComponentApi> = Api extends ComponentApi<
  infer S
>
  ? S
  : never;
