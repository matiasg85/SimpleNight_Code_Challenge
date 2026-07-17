/**
 * hotelData.ts
 *
 * All test inputs for the Hotels category.
 * Edit this file to change search parameters or filter thresholds without
 * touching any test scripts or page objects.
 *
 * To add a new category, create a sibling file (e.g. flightData.ts) following
 * the same pattern and add the corresponding types to types.ts.
 */

import type { HotelFilterParams, HotelSearchParams } from './types';
import { daysFromNow } from '../utils/dateUtils';

/** Nav label for the Hotels category link */
export const HOTEL_CATEGORY = 'Hotels' as const;

/** Search form inputs for the hotel booking flow */
export const HOTEL_SEARCH: HotelSearchParams = {
  location: 'Miami',
  dateRange: {
    checkIn: daysFromNow(30),
    checkOut: daysFromNow(32),
  },
  guests: {
    adults: 1,
    children: [{ age: 8 }], // 1 child, age 8
  },
};

/** Left-panel filter inputs to apply on the hotel results page */
export const HOTEL_FILTERS: HotelFilterParams = {
  priceRange: {
    min: 100,
    // Number.POSITIVE_INFINITY models the open-ended "1000+" slider cap
    max: Number.POSITIVE_INFINITY,
  },
  guestScore: 'Very Good',
};
