/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AppConfig } from './types';

export const config: AppConfig = {
  key: 'train-ticket',
  title: 'Train Ticket Booking',
  heroImage: '/hero.png',
  heroImageDark: '/hero-dark.png',
  background: `radial-gradient(
    at 0% 0%,
    light-dark(rgba(191, 219, 254, 0.35), rgba(14, 116, 144, 0.18)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 0%,
    light-dark(rgba(224, 231, 255, 0.35), rgba(30, 64, 175, 0.16)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 100%,
    light-dark(rgba(207, 250, 254, 0.35), rgba(8, 47, 73, 0.18)) 0px,
    transparent 50%
  ),
  linear-gradient(
    135deg,
    light-dark(#f8fbff, #0b1220) 0%,
    light-dark(#eaf2ff, #162033) 100%
  )`,
  placeholder:
    'Book me a high-speed train from Shanghai to Beijing tomorrow morning.',
  loadingText: [
    'Understanding your route...',
    'Searching available trains...',
    'Preparing the booking flow...',
    'Almost ready...',
  ],
  serverUrl: 'http://localhost:10012',
};
