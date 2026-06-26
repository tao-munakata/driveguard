export interface User {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'manager';
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
}

export interface AlcoholCheck {
  id: string;
  driver_id: string;
  driver_name: string;
  report_id: string | null;
  phase: 'before' | 'after';
  value: string;
  result: 'pass' | 'fail';
  measured_at: string;
}

export interface TripRecord {
  id: string;
  report_id: string;
  depart_at: string;
  arrive_at: string;
  distance_km: string;
  refueled: boolean;
  fuel_amount: string | null;
  fuel_cost: string | null;
  fuel_place: string | null;
}

export interface DrivingReport {
  id: string;
  report_date: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_name: string;
  vehicle_plate: string;
  work_content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  trips?: TripRecord[];
  alcohol_checks?: AlcoholCheck[];
}

export interface DashboardStats {
  pending: string;
  approved: string;
  rejected: string;
  total: string;
  alcohol_fails: number;
  recent_checks: AlcoholCheck[];
  recent_reports: DrivingReport[];
}
