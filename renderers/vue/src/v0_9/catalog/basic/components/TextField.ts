/**
 * @a2ui/vue - TextField component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, ref, type CSSProperties} from 'vue';
import {LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS} from '../utils';

const TextFieldRender = defineComponent({
  name: 'A2ui_TextField',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    const uniqueId = `a2ui-tf-${Math.random().toString(36).slice(2, 9)}`;

    return () => {
      const p = props.props as any;
      const onChange = (e: Event) => {
        const val = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
        if (typeof p.setValue === 'function') {
          p.setValue(val);
        }
      };

      const isLong = p.variant === 'longText';
      const type =
        p.variant === 'number'
          ? 'number'
          : p.variant === 'obscured'
            ? 'password'
            : 'text';
      const hasError = p.validationErrors && p.validationErrors.length > 0;

      const inputStyle: CSSProperties = {
        padding: '8px',
        width: '100%',
        border: STANDARD_BORDER,
        borderRadius: STANDARD_RADIUS,
        boxSizing: 'border-box',
        borderColor: hasError ? 'red' : undefined,
      };

      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
        margin: LEAF_MARGIN,
      };

      const children: any[] = [];
      if (p.label) {
        children.push(
          h('label', {
            htmlFor: uniqueId,
            style: {fontSize: '14px', fontWeight: 'bold'},
            textContent: p.label,
          }),
        );
      }
      if (isLong) {
        children.push(
          h('textarea', {
            id: uniqueId,
            style: inputStyle,
            value: p.value || '',
            onInput: onChange,
          }),
        );
      } else {
        children.push(
          h('input', {
            id: uniqueId,
            type,
            style: inputStyle,
            value: p.value || '',
            onInput: onChange,
          }),
        );
      }
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

export {TextFieldRender};
