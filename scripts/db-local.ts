/**
 * Starts a throw-away local PostgreSQL for development — no Docker or system install needed.
 * Data lives in ./.pgdata. Matches the default DATABASE_URL in .env.example.
 *
 *   npm run db:local        (leave it running in its own terminal)
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';

const dataDir = './.pgdata';
const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: 'himbridge', password: 'himbridge', port: 5433, persistent: true });

async function main() {
  const fresh = !existsSync(`${dataDir}/PG_VERSION`);
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase('himbridge');
  console.log('Local PostgreSQL running → postgres://himbridge:himbridge@localhost:5433/himbridge  (Ctrl+C to stop)');
  if (fresh) console.log('New database: run `npm run db:migrate && npm run db:seed` in another terminal.');
}

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

main().catch(async (err) => {
  console.error(err);
  await pg.stop().catch(() => undefined);
  process.exit(1);
});
