/**
 * @a2ui/vue - Column component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {mapJustify, mapAlign} from '../utils';
import {ChildList} from './ChildList';

const ColumnRender = defineComponent({
  name: 'A2ui_Column',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const style: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: mapJustify(p.justify),
        alignItems: mapAlign(p.align),
        width: '100%',
        margin: 0,
        padding: 0,
      };
      return h('div', {style}, [
        h(ChildList, {
          childList: p.children,
          buildChild: props.buildChild,
        }),
      ]);
    };
  },
});

export {ColumnRender};
