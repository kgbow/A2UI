/**
 * @a2ui/vue - ChildList helper component
 *
 * Renders a list of child components from a ChildList property.
 * Handles both static string arrays and dynamic template-based lists.
 *
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, Fragment, type PropType, type VNode} from 'vue';

export const ChildList = defineComponent({
  name: 'A2ui_ChildList',
  props: {
    childList: {
      type: null as unknown as PropType<unknown>,
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
    return () => {
      const list = props.childList;
      const buildChild = props.buildChild;

      if (Array.isArray(list)) {
        const children: VNode[] = [];
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          // The GenericBinder outputs objects like { id, basePath } for structural nodes
          if (item && typeof item === 'object' && 'id' in item) {
            const node = item as {id: string; basePath?: string};
            const child = buildChild(node.id, node.basePath);
            if (child) {
              children.push(child);
            }
          }
          // Fallback for static string component ID lists
          else if (typeof item === 'string') {
            const child = buildChild(item);
            if (child) {
              children.push(child);
            }
          }
        }
        return h(Fragment, children);
      }

      return null;
    };
  },
});
