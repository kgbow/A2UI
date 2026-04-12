/**
 * @a2ui/vue - Divider component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';

const DividerRender = defineComponent({
  name: 'A2ui_Divider',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const isVertical = p.axis === 'vertical';
      const style: CSSProperties = isVertical
        ? {
            width: '1px',
            alignSelf: 'stretch',
            backgroundColor: '#ccc',
            margin: '0 8px',
          }
        : {
            height: '1px',
            width: '100%',
            backgroundColor: '#ccc',
            margin: '8px 0',
          };
      return h('div', {style});
    };
  },
});

export {DividerRender};
