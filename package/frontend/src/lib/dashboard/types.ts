export interface Stat {
  label: string;
  value: string;
  icon: string;
  change: string;
  changeType: 'positive' | 'negative';
}

export interface Booking {
  id: number;
  customer: string;
  therapist: string;
  service: string;
  time: string;
  status: 'confirmed' | 'in_progress' | 'pending' | 'completed';
  revenue: string;
}

export interface Therapist {
  name: string;
  bookings: number;
  rating: number;
  revenue: string;
  availability: string;
  imageColor: string;
}

export type StatusType = 'confirmed' | 'in_progress' | 'pending' | 'completed';

export interface StatusColor {
  bg: string;
  text: string;
  dot: string;
}
