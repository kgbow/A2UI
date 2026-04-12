/**
 * @a2ui/vue - CheckBox component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {LEAF_MARGIN} from '../utils';

const CheckBoxRender = defineComponent({
  name: 'A2ui_CheckBox',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    const uniqueId = `a2ui-cb-${Math.random().toString(36).slice(2, 9)}`;

    return () => {
      const p = props.props as any;
      const onChange = (e: Event) => {
        if (typeof p.setValue === 'function') {
          p.setValue((e.target as HTMLInputElement).checked);
        }
      };
      const hasError = p.validationErrors && p.validationErrors.length > 0;

      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        margin: LEAF_MARGIN,
      };
      const rowStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      };

      const children: any[] = [
        h('input', {
          id: uniqueId,
          type: 'checkbox',
          checked: !!p.value,
          onChange,
          style: {cursor: 'pointer', outline: hasError ? '1px solid red' : 'none'},
        }),
      ];
      if (p.label) {
        children.push(
          h('label', {
            htmlFor: uniqueId,
            style: {cursor: 'pointer', color: hasError ? 'red' : 'inherit'},
            textContent: p.label,
          }),
        );
      }
      const inner: any[] = [h('div', {style: rowStyle}, children)];
      if (hasError) {
        inner.push(
          h('span', {
            style: {fontSize: '12px', color: 'red', marginTop: '4px'},
            textContent: p.validationErrors?.[0],
          }),
        );
      }
      return h('div', {style: containerStyle}, inner);
    };
  },
});

export {CheckBoxRender};
