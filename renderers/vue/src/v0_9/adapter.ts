/**
 * @a2ui/vue - Vue adapter bridging web_core's GenericBinder to Vue's reactivity.
 *
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import {
  defineComponent,
  h,
  ref,
  watch,
  onUnmounted,
  type Component,
  type VNode,
  type PropType,
  type Ref,
} from 'vue';
import {
  type ComponentContext,
  type ComponentApi,
  GenericBinder,
} from '@a2ui/web_core/v0_9';
import type {
  ResolveA2uiProps,
  InferredComponentApiSchemaType,
} from '@a2ui/web_core/v0_9';
import type {VueComponentImplementation} from './types';

/**
 * Creates a Vue component implementation that uses the GenericBinder
 * to automatically resolve data bindings, actions, and validation.
 *
 * This is the Vue equivalent of React's `createComponentImplementation`.
 * It bridges web_core's subscription-based GenericBinder to Vue's
 * reactivity system using `ref()` and `watch()`.
 */
export function createComponentImplementation<Api extends ComponentApi>(
  api: Api,
  RenderComponent: Component,
): VueComponentImplementation {
  type ResolvedProps = ResolveA2uiProps<InferredComponentApiSchemaType<Api>>;

  const WrapperComponent = defineComponent({
    name: `A2ui_${api.name}`,
    props: {
      context: {
        type: Object as PropType<ComponentContext>,
        required: true,
      },
      buildChild: {
        type: Function as PropType<
          (id: string, basePath?: string) => VNode | null
        >,
        required: true,
      },
    },
    setup(props) {
      const resolvedProps = ref<Partial<ResolvedProps>>(
        {},
      ) as Ref<Partial<ResolvedProps>>;
      let binder: GenericBinder<ResolvedProps> | null = null;
      let subscription: {unsubscribe: () => void} | null = null;

      function createBinder(ctx: ComponentContext) {
        // Dispose previous binder if context changed
        if (subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
        if (binder) {
          binder.dispose();
          binder = null;
        }

        binder = new GenericBinder<ResolvedProps>(ctx, api.schema);

        // Bridge: GenericBinder.subscribe() → Vue ref
        subscription = binder.subscribe(newProps => {
          resolvedProps.value = {...newProps};
        });

        // Sync initial snapshot — subscribe() triggers connect() which fires
        // rebuildAllBindings() → notify() BEFORE our listener is registered,
        // so the initial data push is missed. Read snapshot directly.
        const snapshot = binder.snapshot;
        if (snapshot) {
          resolvedProps.value = {...snapshot};
        }
      }

      // Create the initial binder
      createBinder(props.context);

      // Watch for context changes (e.g. component type replacement)
      // and recreate the binder when the context object identity changes.
      // This mirrors React's useRef + identity check pattern.
      watch(
        () => props.context,
        newContext => {
          createBinder(newContext);
        },
      );

      onUnmounted(() => {
        if (subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
        if (binder) {
          binder.dispose();
          binder = null;
        }
      });

      return () =>
        h(RenderComponent, {
          props: resolvedProps.value || ({} as ResolvedProps),
          buildChild: props.buildChild,
          context: props.context,
        });
    },
  });

  return {
    name: api.name,
    schema: api.schema,
    component: WrapperComponent,
  };
}

/**
 * Creates a Vue component implementation that manages its own context
 * bindings (no generic binder). Useful for components that need
 * custom binding logic.
 */
export function createBinderlessComponentImplementation(
  api: ComponentApi,
  RenderComponent: Component,
): VueComponentImplementation {
  return {
    name: api.name,
    schema: api.schema,
    component: RenderComponent,
  };
}
