/**
 * searchData.ts
 *
 * All test inputs live here — change this file (or load from a fixture JSON)
 * to run the same tests against different search parameters without touching
 * the test scripts or page objects.
 */

import type { HotelFilterParams, HotelSearchParams } from './types';

/** Search form inputs for the hotel booking flow */
export const HOTEL_SEARCH: HotelSearchParams = {
  location: 'Miami',
  dateRange: {
    checkIn: '2026-08-01',
    checkOut: '2026-08-03',
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
