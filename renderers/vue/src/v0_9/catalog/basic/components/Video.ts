/**
 * @a2ui/vue - Video component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';

const VideoRender = defineComponent({
  name: 'A2ui_Video',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const style: CSSProperties = {
        width: '100%',
        margin: '8px',
        boxSizing: 'border-box',
      };
      return h('video', {
        src: p.url,
        style,
        controls: true,
      });
    };
  },
});

export {VideoRender};
