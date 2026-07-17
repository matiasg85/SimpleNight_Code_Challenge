/**
 * flightData.ts
 *
 * All test inputs for the Flights category.
 * Edit this file to change search parameters or filter thresholds without
 * touching any test scripts or page objects.
 */

import type { FlightFilterParams, FlightSearchParams } from './types';
import { daysFromNow } from '../utils/dateUtils';

/** Nav label for the Flights category link */
export const FLIGHT_CATEGORY = 'Flights' as const;

/** Search form inputs for the flight booking flow */
export const FLIGHT_SEARCH: FlightSearchParams = {
  origin: 'New York',       // update to any departure city as needed
  destination: 'Miami',
  dateRange: {
    checkIn: daysFromNow(30),
    checkOut: daysFromNow(32),
  },
  guests: {
    adults: 1,
    children: [{ age: 8 }],
  },
  tripType: 'roundtrip',
};

/** Filter and sort inputs for the flight results page */
export const FLIGHT_FILTERS: FlightFilterParams = {
  stops: 1,
  airline: 'American Airlines',
  sortBy: 'price',
};
