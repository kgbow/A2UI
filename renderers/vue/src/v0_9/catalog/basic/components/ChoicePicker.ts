/**
 * @a2ui/vue - ChoicePicker component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, ref, type CSSProperties} from 'vue';
import {LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS} from '../utils';

const ChoicePickerRender = defineComponent({
  name: 'A2ui_ChoicePicker',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    const filter = ref('');

    return () => {
      const p = props.props as any;
      const values: string[] = Array.isArray(p.value) ? p.value : [];
      const isMutuallyExclusive = p.variant === 'mutuallyExclusive';
      const options: any[] = (p.options || []).filter(
        (opt: any) =>
          !p.filterable ||
          filter.value === '' ||
          String(opt.label).toLowerCase().includes(filter.value.toLowerCase()),
      );

      const onToggle = (val: string) => {
        if (isMutuallyExclusive) {
          if (typeof p.setValue === 'function') p.setValue([val]);
        } else {
          const newValues = values.includes(val)
            ? values.filter((v: string) => v !== val)
            : [...values, val];
          if (typeof p.setValue === 'function') p.setValue(newValues);
        }
      };

      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        margin: LEAF_MARGIN,
        width: '100%',
      };

      const children: any[] = [];
      if (p.label) {
        children.push(h('strong', {style: {fontSize: '14px'}}, p.label));
      }
      if (p.filterable) {
        children.push(
          h('input', {
            type: 'text',
            placeholder: 'Filter options...',
            value: filter.value,
            onInput: (e: Event) => {
              filter.value = (e.target as HTMLInputElement).value;
            },
            style: {
              padding: '4px 8px',
              border: STANDARD_BORDER,
              borderRadius: STANDARD_RADIUS,
            },
          }),
        );
      }

      const isChips = p.displayStyle === 'chips';
      const listStyle: CSSProperties = {
        display: 'flex',
        flexDirection: isChips ? 'row' : 'column',
        flexWrap: isChips ? 'wrap' : 'nowrap',
        gap: '8px',
      };

      const optionChildren = options.map((opt: any, i: number) => {
        const isSelected = values.includes(opt.value);
        if (isChips) {
          return h(
            'button',
            {
              key: i,
              onClick: () => onToggle(opt.value),
              style: {
                padding: '4px 12px',
                borderRadius: '16px',
                border: isSelected
                  ? '1px solid var(--a2ui-primary-color, #007bff)'
                  : STANDARD_BORDER,
                backgroundColor: isSelected
                  ? 'var(--a2ui-primary-color, #007bff)'
                  : '#fff',
                color: isSelected ? '#fff' : 'inherit',
                cursor: 'pointer',
                fontSize: '12px',
              },
            },
            opt.label,
          );
        }
        return h(
          'label',
          {
            key: i,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            },
          },
          [
            h('input', {
              type: isMutuallyExclusive ? 'radio' : 'checkbox',
              checked: isSelected,
              onChange: () => onToggle(opt.value),
              name: isMutuallyExclusive
                ? `choice-${props.context?.componentModel?.id}`
                : undefined,
            }),
            h('span', {style: {fontSize: '14px'}}, opt.label),
          ],
        );
      });
      children.push(h('div', {style: listStyle}, optionChildren));

      return h('div', {style: containerStyle}, children);
    };
  },
});

export {ChoicePickerRender};
