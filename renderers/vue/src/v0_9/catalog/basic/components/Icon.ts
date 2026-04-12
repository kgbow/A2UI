/**
 * @a2ui/vue - Icon component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, type CSSProperties} from 'vue';

const ICON_NAMES: Record<string, string> = {
  accountCircle: 'account_circle',
  add: 'add',
  arrowBack: 'arrow_back',
  arrowForward: 'arrow_forward',
  attachFile: 'attach_file',
  calendarToday: 'calendar_today',
  call: 'call',
  camera: 'camera',
  check: 'check',
  close: 'close',
  delete: 'delete',
  download: 'download',
  edit: 'edit',
  event: 'event',
  error: 'error',
  fastForward: 'fast_forward',
  favorite: 'favorite',
  favoriteOff: 'favorite_border',
  folder: 'folder',
  help: 'help',
  home: 'home',
  info: 'info',
  locationOn: 'location_on',
  lock: 'lock',
  lockOpen: 'lock_open',
  mail: 'mail',
  menu: 'menu',
  moreVert: 'more_vert',
  moreHoriz: 'more_horiz',
  notificationsOff: 'notifications_off',
  notifications: 'notifications',
  pause: 'pause',
  payment: 'payment',
  person: 'person',
  phone: 'phone',
  photo: 'photo',
  play: 'play_arrow',
  print: 'print',
  refresh: 'refresh',
  rewind: 'rewind',
  search: 'search',
  send: 'send',
  settings: 'settings',
  share: 'share',
  shoppingCart: 'shopping_cart',
  skipNext: 'skip_next',
  skipPrevious: 'skip_previous',
  star: 'star',
  starHalf: 'star_half',
  starOff: 'star_border',
  stop: 'stop',
  upload: 'upload',
  visibility: 'visibility',
  visibilityOff: 'visibility_off',
  volumeDown: 'volume_down',
  volumeMute: 'volume_mute',
  volumeOff: 'volume_off',
  volumeUp: 'volume_up',
  warning: 'warning',
};

const IconRender = defineComponent({
  name: 'A2ui_Icon',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    return () => {
      const p = props.props as any;
      const rawName = p.name || '';

      // The protocol allows name to be either a string enum value
      // or { path: 'M10 20...' } for custom SVG path data
      const isPath = typeof rawName === 'object' && rawName !== null && 'path' in rawName;

      if (isPath) {
        // Render SVG with the path data
        const svgPath = (rawName as {path: string}).path;
        return h('svg', {
          viewBox: '0 0 24 24',
          width: '24',
          height: '24',
          style: {
            margin: '8px',
            display: 'inline-block',
            verticalAlign: 'middle',
            fill: 'currentColor',
          },
          innerHTML: `<path d="${svgPath}"/>`,
        });
      }

      const materialName = ICON_NAMES[rawName as string] || (rawName as string);
      const style: CSSProperties = {
        margin: '8px',
        fontSize: '24px',
        lineHeight: '1',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Material Symbols Outlined', 'Material Icons', sans-serif",
        userSelect: 'none',
      };
      return h('span', {
        class: 'material-symbols-outlined',
        style,
        textContent: materialName,
      });
    };
  },
});

export {IconRender};
