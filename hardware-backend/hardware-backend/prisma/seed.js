// Prisma's CLI (`npm run prisma:seed` -> `node prisma/seed.js`) expects the
// seed entrypoint here. Actual seed logic lives in src/seeds/ split by
// concern (adminSeeder, categorySeeder, productSeeder) per the requested
// folder structure — this file just triggers it.
import '../src/seeds/index.js';
