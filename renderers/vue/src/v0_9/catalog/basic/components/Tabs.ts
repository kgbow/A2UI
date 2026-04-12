/**
 * @a2ui/vue - Tabs component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, ref, type CSSProperties} from 'vue';
import {LEAF_MARGIN} from '../utils';

const TabsRender = defineComponent({
  name: 'A2ui_Tabs',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    const selectedIndex = ref(0);

    return () => {
      const p = props.props as any;
      const tabs = p.tabs || [];
      const activeTab = tabs[selectedIndex.value];

      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        margin: LEAF_MARGIN,
      };
      const tabBarStyle: CSSProperties = {
        display: 'flex',
        borderBottom: '1px solid #ccc',
        marginBottom: '8px',
      };

      const tabButtons = tabs.map((tab: any, i: number) => {
        const isActive = selectedIndex.value === i;
        const btnStyle: CSSProperties = {
          padding: '8px 16px',
          border: 'none',
          background: 'none',
          borderBottom: isActive
            ? '2px solid var(--a2ui-primary-color, #007bff)'
            : 'none',
          fontWeight: isActive ? 'bold' : 'normal',
          cursor: 'pointer',
          color: isActive
            ? 'var(--a2ui-primary-color, #007bff)'
            : 'inherit',
        };
        return h(
          'button',
          {
            key: i,
            style: btnStyle,
            onClick: () => {
              selectedIndex.value = i;
            },
          },
          tab.title,
        );
      });

      const content = activeTab
        ? props.buildChild(activeTab.child)
        : null;

      return h('div', {style: containerStyle}, [
        h('div', {style: tabBarStyle}, tabButtons),
        h('div', {style: {flex: 1}}, content ? [content] : undefined),
      ]);
    };
  },
});

export {TabsRender};
