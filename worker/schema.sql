CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('driver','manager')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plate TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS driving_reports (
  id TEXT PRIMARY KEY,
  report_date TEXT NOT NULL,
  driver_id TEXT NOT NULL REFERENCES users(id),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  work_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alcohol_checks (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES users(id),
  report_id TEXT REFERENCES driving_reports(id),
  phase TEXT NOT NULL CHECK (phase IN ('before','after')),
  value REAL NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pass','fail')),
  measured_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trip_records (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES driving_reports(id),
  depart_at TEXT NOT NULL,
  arrive_at TEXT NOT NULL,
  distance_km REAL NOT NULL,
  refueled INTEGER NOT NULL DEFAULT 0,
  fuel_amount REAL,
  fuel_cost REAL,
  fuel_place TEXT
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES driving_reports(id),
  manager_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('approved','rejected')),
  note TEXT,
  acted_at TEXT DEFAULT (datetime('now'))
);
