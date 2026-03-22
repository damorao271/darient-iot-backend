import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { seedPlaces } from './places.seed.js';
import { seedSpaces } from './spaces.seed.js';
import { seedReservations } from './reservations.seed.js';

const dbUrl =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER}:${encodeURIComponent(process.env.POSTGRES_PASSWORD ?? '')}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}/${process.env.POSTGRES_DB}`;

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedPlaces(prisma);
  await seedSpaces(prisma);
  await seedReservations(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
