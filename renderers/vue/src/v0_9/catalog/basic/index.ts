/**
 * @a2ui/vue - Basic catalog assembly
 *
 * Registers all 18 basic components with web_core's Catalog system.
 * Copyright 2026 Google LLC
 */

import {Catalog} from '@a2ui/web_core/v0_9';
import {BASIC_FUNCTIONS} from '@a2ui/web_core/v0_9/basic_catalog';
import {
  TextApi,
  ImageApi,
  IconApi,
  VideoApi,
  AudioPlayerApi,
  RowApi,
  ColumnApi,
  ListApi,
  CardApi,
  TabsApi,
  DividerApi,
  ModalApi,
  ButtonApi,
  TextFieldApi,
  CheckBoxApi,
  ChoicePickerApi,
  SliderApi,
  DateTimeInputApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import type {VueComponentImplementation} from '../../types';
import {createComponentImplementation} from '../../adapter';

import {TextRender} from './components/Text';
import {ImageRender} from './components/Image';
import {IconRender} from './components/Icon';
import {VideoRender} from './components/Video';
import {AudioPlayerRender} from './components/AudioPlayer';
import {RowRender} from './components/Row';
import {ColumnRender} from './components/Column';
import {ListRender} from './components/List';
import {CardRender} from './components/Card';
import {TabsRender} from './components/Tabs';
import {DividerRender} from './components/Divider';
import {ModalRender} from './components/Modal';
import {ButtonRender} from './components/Button';
import {TextFieldRender} from './components/TextField';
import {CheckBoxRender} from './components/CheckBox';
import {ChoicePickerRender} from './components/ChoicePicker';
import {SliderRender} from './components/Slider';
import {DateTimeInputRender} from './components/DateTimeInput';

const basicComponents: VueComponentImplementation[] = [
  createComponentImplementation(TextApi, TextRender),
  createComponentImplementation(ImageApi, ImageRender),
  createComponentImplementation(IconApi, IconRender),
  createComponentImplementation(VideoApi, VideoRender),
  createComponentImplementation(AudioPlayerApi, AudioPlayerRender),
  createComponentImplementation(RowApi, RowRender),
  createComponentImplementation(ColumnApi, ColumnRender),
  createComponentImplementation(ListApi, ListRender),
  createComponentImplementation(CardApi, CardRender),
  createComponentImplementation(TabsApi, TabsRender),
  createComponentImplementation(DividerApi, DividerRender),
  createComponentImplementation(ModalApi, ModalRender),
  createComponentImplementation(ButtonApi, ButtonRender),
  createComponentImplementation(TextFieldApi, TextFieldRender),
  createComponentImplementation(CheckBoxApi, CheckBoxRender),
  createComponentImplementation(ChoicePickerApi, ChoicePickerRender),
  createComponentImplementation(SliderApi, SliderRender),
  createComponentImplementation(DateTimeInputApi, DateTimeInputRender),
];

export const basicCatalog = new Catalog<VueComponentImplementation>(
  'https://a2ui.org/specification/v0_9/basic_catalog.json',
  basicComponents,
  BASIC_FUNCTIONS,
);
