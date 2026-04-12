/**
 * @a2ui/vue - Image component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';

const ImageRender = defineComponent({
  name: 'A2ui_Image',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const fitMap: Record<string, string> = {
        contain: 'contain',
        cover: 'cover',
        fill: 'fill',
        none: 'none',
        scaleDown: 'scale-down',
      };
      const sizeMap: Record<string, CSSProperties> = {
        icon: {width: '24px', height: '24px'},
        avatar: {width: '40px', height: '40px', borderRadius: '50%'},
        smallFeature: {width: '80px', height: '80px'},
        mediumFeature: {width: '150px', height: '150px'},
        largeFeature: {width: '300px', height: '300px'},
        header: {width: '100%', height: '200px'},
      };
      const variant = p.variant || 'mediumFeature';
      const sizeStyle = sizeMap[variant] || sizeMap.mediumFeature;
      const style: CSSProperties = {
        ...sizeStyle,
        objectFit: fitMap[p.fit || 'fill'] as any,
        margin: '8px',
        boxSizing: 'border-box',
      };
      return h('img', {
        src: p.url,
        alt: p.description || '',
        style,
      });
    };
  },
});

export {ImageRender};
