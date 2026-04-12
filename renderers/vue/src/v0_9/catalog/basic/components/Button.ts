/**
 * @a2ui/vue - Button component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {LEAF_MARGIN} from '../utils';

const ButtonRender = defineComponent({
  name: 'A2ui_Button',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const style: CSSProperties = {
        margin: LEAF_MARGIN,
        padding: '8px 16px',
        cursor: p.isValid === false ? 'not-allowed' : 'pointer',
        border:
          p.variant === 'borderless' ? 'none' : '1px solid #ccc',
        backgroundColor:
          p.variant === 'primary'
            ? 'var(--a2ui-primary-color, #007bff)'
            : p.variant === 'borderless'
              ? 'transparent'
              : '#fff',
        color: p.variant === 'primary' ? '#fff' : 'inherit',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        opacity: p.isValid === false ? 0.6 : 1,
      };
      const onClick = () => {
        if (typeof p.action === 'function') {
          p.action();
        }
      };
      const child = p.child ? props.buildChild(p.child) : null;
      return h('button', {style, onClick, disabled: p.isValid === false}, child ? [child] : undefined);
    };
  },
});

export {ButtonRender};
