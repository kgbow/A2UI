/**
 * @a2ui/vue - Slider component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {LEAF_MARGIN} from '../utils';

const SliderRender = defineComponent({
  name: 'A2ui_Slider',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const onInput = (e: Event) => {
        if (typeof p.setValue === 'function') {
          p.setValue(Number((e.target as HTMLInputElement).value));
        }
      };

      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        margin: LEAF_MARGIN,
        width: '100%',
      };

      const children: any[] = [];
      if (p.label) {
        children.push(
          h('label', {style: {fontSize: '14px', fontWeight: 'bold'}}, p.label),
        );
      }
      children.push(
        h('input', {
          type: 'range',
          min: p.min ?? 0,
          max: p.max ?? 100,
          value: p.value ?? 0,
          onInput,
          style: {width: '100%', cursor: 'pointer'},
        }),
      );
      children.push(
        h('span', {style: {fontSize: '12px', color: '#666'}}, String(p.value ?? 0)),
      );
      return h('div', {style: containerStyle}, children);
    };
  },
});

export {SliderRender};
