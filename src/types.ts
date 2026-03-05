export interface Barber {
  name: string;
  ghlUserId: string;
  photoUrl: string;
  calendars?: {
    haircut: string;
    haircutBeard: string;
  };
}

export interface TattooArtist {
  name: string;
  ghlUserId: string;
  photoUrl: string;
  calendarId: string;
}

export type ServiceType = 'haircut' | 'haircut_beard';

export type SlotTier = 'now' | '5-10' | '10-20' | 'later';

export interface TieredSlot {
  startTime: string;
  endTime: string;
  tier: SlotTier;
}

export interface BarberAvailability {
  barberName: string;
  barberGhlUserId: string;
  barberPhoto: string;
  calendarId: string;
  slotDuration: number;
  price: number;
  tier: SlotTier; // best (earliest) tier
  slots: TieredSlot[];
}

export interface Appointment {
  id: string;
  contactId: string | null;
  contactName: string;
  contactPhone: string | null;
  startTime: string;
  endTime: string;
  status: string;
  calendarId: string | null;
  service: string | null;
}

export interface AppointmentsResponse extends ApiResponse {
  appointments: Appointment[];
}

export interface PhoneLookupResponse extends ApiResponse {
  found: boolean;
  reason: 'found_today' | 'wrong_day' | 'no_appointment' | 'no_contact';
  appointment?: {
    id: string;
    contactId: string;
    contactName: string;
    startTime: string;
    endTime: string;
  };
  contactId?: string;
  contactName?: string;
}

export interface CheckInRequest {
  ghlUserId: string;
  customerName: string;
  location: 'barbershop' | 'tattoo';
  type: 'appointment' | 'name_only';
  appointmentId?: string;
  contactId?: string;
}

export interface WalkInBookRequest {
  calendarId: string;
  barberGhlUserId: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  service: ServiceType;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}

export interface BarberSlotsResponse extends ApiResponse {
  barbers: BarberAvailability[];
  days: number;
}

export interface BookResponse extends ApiResponse {
  appointmentId?: string;
}
