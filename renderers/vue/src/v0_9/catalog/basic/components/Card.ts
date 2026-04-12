/**
 * @a2ui/vue - Card component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {getBaseContainerStyle} from '../utils';

const CardRender = defineComponent({
  name: 'A2ui_Card',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const style: CSSProperties = {
        ...getBaseContainerStyle(),
        display: 'flex',
        flexDirection: 'column',
      };
      const child = p.child ? props.buildChild(p.child) : null;
      return h('div', {style}, child ? [child] : undefined);
    };
  },
});

export {CardRender};
