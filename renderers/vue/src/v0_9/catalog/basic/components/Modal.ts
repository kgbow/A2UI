/**
 * @a2ui/vue - Modal component
 * Copyright 2026 Google LLC
 */

import {defineComponent, h, ref, type CSSProperties, Teleport, Fragment} from 'vue';

const ModalRender = defineComponent({
  name: 'A2ui_Modal',
  props: {
    props: {type: Object, required: true},
    buildChild: {type: Function, required: true},
    context: {type: Object, required: true},
  },
  setup(props) {
    const isOpen = ref(false);

    return () => {
      const p = props.props as any;
      const trigger = p.trigger ? props.buildChild(p.trigger) : null;
      const content = p.content ? props.buildChild(p.content) : null;

      const overlayStyle: CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      };

      const modalStyle: CSSProperties = {
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '90%',
        maxHeight: '90%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      };

      const closeButtonStyle: CSSProperties = {
        border: 'none',
        background: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '4px',
      };

      const children: any[] = [
        h(
          'div',
          {
            style: {display: 'inline-block'},
            onClick: () => {
              isOpen.value = true;
            },
          },
          trigger ? [trigger] : undefined,
        ),
      ];

      if (isOpen.value) {
        const modalContent = h(
          'div',
          {
            style: modalStyle,
            onClick: (e: Event) => e.stopPropagation(),
          },
          [
            h(
              'div',
              {style: {display: 'flex', justifyContent: 'flex-end'}},
              [
                h(
                  'button',
                  {
                    style: closeButtonStyle,
                    onClick: () => {
                      isOpen.value = false;
                    },
                  },
                  '\u00d7',
                ),
              ],
            ),
            h('div', {style: {flex: 1}}, content ? [content] : undefined),
          ],
        );

        children.push(
          h(
            Teleport,
            {to: 'body'},
            [
              h(
                'div',
                {
                  style: overlayStyle,
                  onClick: () => {
                    isOpen.value = false;
                  },
                },
                [modalContent],
              ),
            ],
          ),
        );
      }

      return h(Fragment, children);
    };
  },
});

export {ModalRender};
