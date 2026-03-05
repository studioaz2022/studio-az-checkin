import { BACKEND_URL } from './constants';
import type { ApiResponse, AppointmentsResponse, PhoneLookupResponse, BarberSlotsResponse, BookResponse, CheckInRequest, WalkInBookRequest, ServiceType } from '@/types';

async function post<T extends ApiResponse>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

async function get<T extends ApiResponse>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export async function checkIn(request: CheckInRequest): Promise<ApiResponse> {
  return post('/api/kiosk/check-in', request);
}

export async function getBarberAppointments(ghlUserId: string): Promise<AppointmentsResponse> {
  return get(`/api/kiosk/barber-appointments?ghlUserId=${encodeURIComponent(ghlUserId)}`);
}

export async function phoneLookup(phone: string, ghlUserId: string): Promise<PhoneLookupResponse> {
  return get(`/api/kiosk/phone-lookup?phone=${encodeURIComponent(phone)}&ghlUserId=${encodeURIComponent(ghlUserId)}`);
}

export async function getTattooAppointments(ghlUserId: string): Promise<AppointmentsResponse> {
  return get(`/api/kiosk/tattoo-appointments?ghlUserId=${encodeURIComponent(ghlUserId)}`);
}

export async function getWalkInSlots(service: ServiceType, days = 0): Promise<BarberSlotsResponse> {
  return get(`/api/kiosk/walk-in-slots?service=${service}&days=${days}`);
}

export async function bookWalkIn(request: WalkInBookRequest): Promise<BookResponse> {
  return post('/api/kiosk/walk-in-book', request);
}
