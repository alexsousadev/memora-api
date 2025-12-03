import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import envLoader from '../config/env_loader';
import * as schema from './schema';

const pool = new Pool({
  connectionString: envLoader.getEnv("DATABASE_URL"),
});

export const db = drizzle(pool, { schema });

