/**
 * @a2ui/vue - DateTimeInput component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS} from '../utils';

const DateTimeInputRender = defineComponent({
  name: 'A2ui_DateTimeInput',
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
          p.setValue((e.target as HTMLInputElement).value);
        }
      };
      const hasError = p.validationErrors && p.validationErrors.length > 0;

      // Determine input type based on enableDate/enableTime
      let inputType = 'text';
      if (p.enableDate && p.enableTime) {
        inputType = 'datetime-local';
      } else if (p.enableDate) {
        inputType = 'date';
      } else if (p.enableTime) {
        inputType = 'time';
      }

      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
        margin: LEAF_MARGIN,
      };

      const inputStyle: CSSProperties = {
        padding: '8px',
        width: '100%',
        border: STANDARD_BORDER,
        borderRadius: STANDARD_RADIUS,
        boxSizing: 'border-box',
        borderColor: hasError ? 'red' : undefined,
      };

      const children: any[] = [];
      if (p.label) {
        children.push(
          h('label', {style: {fontSize: '14px', fontWeight: 'bold'}}, p.label),
        );
      }
      const inputAttrs: any = {
        type: inputType,
        style: inputStyle,
        value: p.value || '',
        onInput,
      };
      if (p.min) inputAttrs.min = p.min;
      if (p.max) inputAttrs.max = p.max;
      children.push(h('input', inputAttrs));

      if (hasError) {
        children.push(
          h('span', {
            style: {fontSize: '12px', color: 'red'},
            textContent: p.validationErrors[0],
          }),
        );
      }
      return h('div', {style: containerStyle}, children);
    };
  },
});

export {DateTimeInputRender};
