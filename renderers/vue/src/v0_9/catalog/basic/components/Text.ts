/**
 * @a2ui/vue - Text component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';
import MarkdownIt from 'markdown-it';
import type {VueA2uiComponentProps} from '../../types';
import {getBaseLeafStyle} from '../utils';

// Lazy-initialized markdown parser (lightweight config per A2UI spec)
let md: MarkdownIt | null = null;
function getMarkdownParser(): MarkdownIt {
  if (!md) {
    md = new MarkdownIt({
      html: false,       // Disable HTML tags (security)
      linkify: false,    // No auto link detection
      breaks: true,      // Convert \n to <br>
    });
  }
  return md;
}

const TextRender = defineComponent({
  name: 'A2ui_Text',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as VueA2uiComponentProps['props'] & {
        text?: string;
        variant?: string;
      };
      const text = p.text ?? '';
      const style: CSSProperties = {...getBaseLeafStyle(), display: 'inline-block'};

      switch (p.variant) {
        case 'h1':
          return h('h1', {style}, text);
        case 'h2':
          return h('h2', {style}, text);
        case 'h3':
          return h('h3', {style}, text);
        case 'h4':
          return h('h4', {style}, text);
        case 'h5':
          return h('h5', {style}, text);
        case 'caption':
          return h('div', {style: {...style, color: '#666', textAlign: 'left'}}, text);
        case 'body':
        default: {
          // Body text supports basic Markdown (bold, italic, lists)
          const hasMarkdown = /[*_`\n]/.test(text);
          if (hasMarkdown) {
            const html = getMarkdownParser().renderInline(text);
            return h('span', {style, innerHTML: html});
          }
          return h('span', {style}, text);
        }
      }
    };
  },
});

export {TextRender};
