import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'driveguard',
  user: process.env.POSTGRES_USER || 'driveguard',
  password: process.env.POSTGRES_PASSWORD || 'driveguard_pass',
});

export default pool;
