import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set');
}

// Configurações do SSL lendo das variáveis de ambiente.
// O conteúdo dos arquivos .pem é colocado dentro das aspas.
const sslConfig = 
  process.env.PG_SSL_CERT && process.env.PG_SSL_KEY
  ? {
      rejectUnauthorized: true, // Força a verificação do certificado da CA
      cert: process.env.PG_SSL_CERT.replace(/\\n/g, '\n'),
      key: process.env.PG_SSL_KEY.replace(/\\n/g, '\n'),
      ca: process.env.PG_SSL_CA
        ? process.env.PG_SSL_CA.replace(/\\n/g, '\n')
        : undefined,
    }
  : undefined;

// O pool de conexões garante que não estamos abrindo e fechando
// conexões em cada requisição, o que seria ineficiente.
const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: sslConfig,
});

export default db;
