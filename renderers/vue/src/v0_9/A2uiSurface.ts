/**
 * @a2ui/vue - DeferredChild component
 *
 * Subscribes to a component's existence in the SurfaceComponentsModel.
 * Renders a loading placeholder if the component hasn't arrived yet,
 * or delegates to the resolved component implementation.
 *
 * Vue equivalent of React's DeferredChild.
 * Copyright 2026 Google LLC
 */

import {
  defineComponent,
  h,
  ref,
  onUnmounted,
  type PropType,
  type VNode,
} from 'vue';
import {
  ComponentContext,
  type SurfaceModel,
  type ComponentModel,
} from '@a2ui/web_core/v0_9';
import type {VueComponentImplementation} from './types';

/**
 * ResolvedChild: renders a known component using its Vue implementation.
 */
const ResolvedChild = defineComponent({
  name: 'ResolvedChild',
  props: {
    surface: {
      type: Object as PropType<SurfaceModel<VueComponentImplementation>>,
      required: true,
    },
    id: {type: String, required: true},
    basePath: {type: String, required: true},
    componentModel: {
      type: Object as PropType<ComponentModel>,
      required: true,
    },
    compImpl: {
      type: Object as PropType<VueComponentImplementation>,
      required: true,
    },
  },
  setup(props) {
    const buildChild = (
      childId: string,
      specificPath?: string,
    ): VNode | null => {
      const path = specificPath || props.basePath;
      return h(DeferredChild, {
        key: `${childId}-${path}`,
        surface: props.surface,
        id: childId,
        basePath: path,
      });
    };

    return () => {
      const context = new ComponentContext(
        props.surface,
        props.id,
        props.basePath,
      );
      const ComponentToRender = props.compImpl.component;
      return h(ComponentToRender, {
        context,
        buildChild,
      });
    };
  },
});

/**
 * DeferredChild: subscribes to component existence and renders when available.
 */
export const DeferredChild = defineComponent({
  name: 'DeferredChild',
  props: {
    surface: {
      type: Object as PropType<SurfaceModel<VueComponentImplementation>>,
      required: true,
    },
    id: {type: String, required: true},
    basePath: {type: String, required: true},
  },
  setup(props) {
    // Track a version counter to force re-renders when component
    // is created or deleted
    const version = ref(0);

    const onCreated = (comp: ComponentModel) => {
      if (comp.id === props.id) {
        version.value++;
      }
    };

    const onDeleted = (delId: string) => {
      if (delId === props.id) {
        version.value++;
      }
    };

    // Subscribe to component lifecycle events
    const unsub1 = props.surface.componentsModel.onCreated.subscribe(onCreated);
    const unsub2 = props.surface.componentsModel.onDeleted.subscribe(onDeleted);

    onUnmounted(() => {
      unsub1.unsubscribe();
      unsub2.unsubscribe();
    });

    return () => {
      // Access version to make this reactive
      void version.value;

      const componentModel = props.surface.componentsModel.get(props.id);

      if (!componentModel) {
        return h(
          'div',
          {style: {color: 'gray', padding: '4px'}},
          `[Loading ${props.id}...]`,
        );
      }

      const compImpl = props.surface.catalog.components.get(componentModel.type);

      if (!compImpl) {
        return h(
          'div',
          {style: {color: 'red'}},
          `Unknown component: ${componentModel.type}`,
        );
      }

      return h(ResolvedChild, {
        surface: props.surface,
        id: props.id,
        basePath: props.basePath,
        componentModel,
        compImpl,
      });
    };
  },
});

/**
 * A2uiSurface: convenience component that renders a complete A2UI surface.
 *
 * Usage:
 * ```vue
 * <A2uiSurface :surface="mySurfaceModel" />
 * ```
 */
export const A2uiSurface = defineComponent({
  name: 'A2uiSurface',
  props: {
    surface: {
      type: Object as PropType<SurfaceModel<VueComponentImplementation>>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(DeferredChild, {
        surface: props.surface,
        id: 'root',
        basePath: '/',
      });
  },
});
