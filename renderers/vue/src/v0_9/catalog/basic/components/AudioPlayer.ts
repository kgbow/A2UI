/**
 * @a2ui/vue - AudioPlayer component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {LEAF_MARGIN} from '../utils';

const AudioPlayerRender = defineComponent({
  name: 'A2ui_AudioPlayer',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        margin: LEAF_MARGIN,
        padding: '12px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxSizing: 'border-box',
      };
      const children: any[] = [];
      if (p.description) {
        children.push(h('span', {style: {fontSize: '14px', fontWeight: 'bold'}}, p.description));
      }
      children.push(h('audio', {src: p.url, controls: true, style: {width: '100%'}}));
      return h('div', {style: containerStyle}, children);
    };
  },
});

export {AudioPlayerRender};
