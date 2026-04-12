/**
 * @a2ui/vue - List component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import {mapAlign} from '../utils';
import {ChildList} from './ChildList';

const ListRender = defineComponent({
  name: 'A2ui_List',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const isHorizontal = p.direction === 'horizontal';
      const style: CSSProperties = {
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: mapAlign(p.align),
        width: '100%',
        overflow: isHorizontal ? 'auto' : undefined,
        gap: '4px',
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

export {ListRender};
