import pool from './db';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('driver','manager')),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        plate VARCHAR(50) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS driving_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_date DATE NOT NULL,
        driver_id UUID NOT NULL REFERENCES users(id),
        vehicle_id UUID NOT NULL REFERENCES vehicles(id),
        work_content TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS alcohol_checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id UUID NOT NULL REFERENCES users(id),
        report_id UUID REFERENCES driving_reports(id),
        phase VARCHAR(10) NOT NULL CHECK (phase IN ('before','after')),
        value DECIMAL(5,3) NOT NULL,
        result VARCHAR(10) NOT NULL CHECK (result IN ('pass','fail')),
        measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trip_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES driving_reports(id),
        depart_at TIMESTAMPTZ NOT NULL,
        arrive_at TIMESTAMPTZ NOT NULL,
        distance_km DECIMAL(8,2) NOT NULL,
        refueled BOOLEAN NOT NULL DEFAULT false,
        fuel_amount DECIMAL(8,2),
        fuel_cost DECIMAL(10,0),
        fuel_place VARCHAR(200)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES driving_reports(id),
        manager_id UUID NOT NULL REFERENCES users(id),
        action VARCHAR(10) NOT NULL CHECK (action IN ('approved','rejected')),
        note TEXT,
        acted_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Seed only if empty (password: password123)
    const { rows } = await client.query('SELECT count(*) FROM users');
    if (parseInt(rows[0].count) === 0) {
      const hash = '$2a$10$QB7kJZnNALrfySEwSetH9eEgXoovoQTmk2H/IkZ12ig4k.Yk2Ek0O';
      await client.query(`
        INSERT INTO users (name, email, password_hash, role) VALUES
          ('管理者 田中', 'manager@example.com', $1, 'manager'),
          ('運転者 佐藤', 'driver1@example.com', $1, 'driver'),
          ('運転者 鈴木', 'driver2@example.com', $1, 'driver')
      `, [hash]);
      await client.query(`
        INSERT INTO vehicles (name, plate) VALUES
          ('営業車A', '品川 300 あ 1234'),
          ('トラックB', '品川 400 い 5678')
      `);
      console.log('Seed data inserted');
    }

    console.log('Migrations complete');
  } finally {
    client.release();
  }
}
