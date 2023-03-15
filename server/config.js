const env = process.env;

const config = {
  db: { 
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT ||  '3306',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'Dapp',
  },
};
export default config;


