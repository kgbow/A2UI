import {createTextSurfaceMessages, type A2UIMessage} from '../protocol/a2ui.js';
import type {BusinessView} from '../opencode-client.js';
import {
  createBookingFormMessages,
  createConfirmationMessages,
  createRestaurantListMessages,
} from './templates/restaurant.js';

export function mapBusinessViewToA2UI(view: BusinessView): A2UIMessage[] {
  switch (view.intent) {
    case 'restaurant_list':
      return createRestaurantListMessages(view.title, view.items);
    case 'booking_form':
      return createBookingFormMessages(
        view.restaurantName,
        view.imageUrl,
        view.address
      );
    case 'booking_confirmation':
      return createConfirmationMessages(
        view.restaurantName,
        view.partySize,
        view.reservationTime,
        view.dietary,
        view.imageUrl
      );
    case 'error_view':
      return createTextSurfaceMessages(
        view.title ?? 'OpenCode Adapter Error',
        view.message,
        'error'
      );
  }
}
