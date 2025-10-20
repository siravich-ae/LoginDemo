import sql from 'mssql';

const config: sql.config = {
  server: process.env.SQL_SERVER as string,
  port: Number(process.env.SQL_PORT || 1433),
  user: process.env.SQL_USER as string,
  password: process.env.SQL_PASSWORD as string,
  database: process.env.SQL_DB as string,
  options: { encrypt: false, trustServerCertificate: true },
};

let pool: sql.ConnectionPool | null = null;
export async function getPool() {
  if (pool?.connected) return pool;
  pool = await new sql.ConnectionPool(config).connect();
  return pool;
}
export { sql };
