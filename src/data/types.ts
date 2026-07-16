// ---------------------------------------------------------------------------
// Shared TypeScript interfaces and constants used across the framework.
// ---------------------------------------------------------------------------

/** Search inputs for a hotel query */
export interface HotelSearchParams {
  location: string;
  dateRange: DateRange;
  guests: GuestConfig;
}

/** ISO-8601 date pair (YYYY-MM-DD) */
export interface DateRange {
  checkIn: string;
  checkOut: string;
}

export interface GuestConfig {
  adults: number;
  children: ChildGuest[];
}

export interface ChildGuest {
  /** Age in years to select in the child-age dropdown */
  age: number;
}

export interface PriceRange {
  min: number;
  /** Use Number.POSITIVE_INFINITY to represent an open-ended "1000+" cap */
  max: number;
}

export type GuestScore =
  | 'Exceptional'
  | 'Excellent'
  | 'Very Good'
  | 'Good'
  | 'No Rating';

/**
 * Minimum numeric score (out of 10) that each GuestScore label represents.
 * Adjust if the site uses a different scale.
 */
export const GUEST_SCORE_THRESHOLDS: Record<GuestScore, number> = {
  Exceptional: 9.0,
  Excellent: 8.0,
  'Very Good': 7.0,
  Good: 6.0,
  'No Rating': 0,
};

/** Combined filter parameters for the hotel results page */
export interface HotelFilterParams {
  priceRange: PriceRange;
  guestScore: GuestScore;
}
