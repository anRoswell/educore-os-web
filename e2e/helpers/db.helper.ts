import { Client } from 'pg';

export const dbConfig = {
  host: process.env['DB_HOST'] || '127.0.0.1',
  port: Number(process.env['DB_PORT']) || 52132,
  user: process.env['DB_USER'] || 'educore_user_qa',
  password: process.env['DB_PASSWORD'] || 'Ing3n13r0D3v3l0p3r_EduCoreOS_QA2026*',
  database: process.env['DB_NAME'] || 'educoreos_db_qa',
};

/**
 * Execute a query directly against the PostgreSQL QA database
 */
export async function queryDb<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(queryText, params);
    return result.rows;
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * Verify if a record exists matching the condition
 */
export async function recordExists(tableName: string, condition: string, params: any[] = []): Promise<boolean> {
  const rows = await queryDb(`SELECT 1 FROM ${tableName} WHERE ${condition} LIMIT 1`, params);
  return rows.length > 0;
}
