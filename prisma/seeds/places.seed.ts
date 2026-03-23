import type { PrismaClient } from '../../generated/prisma/client.js';

const PLACES = [
  {
    name: 'Demo Office',
    latitude: 40.4168,
    longitude: -3.7038,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Main Warehouse',
    latitude: 40.4378,
    longitude: -3.6917,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'North Campus',
    latitude: 40.4521,
    longitude: -3.7289,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Tech Hub',
    latitude: 40.4247,
    longitude: -3.6856,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Distribution Center',
    latitude: 40.4012,
    longitude: -3.6612,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Central Station Office',
    latitude: 40.4056,
    longitude: -3.6888,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Retail Store Alpha',
    latitude: 40.4298,
    longitude: -3.7034,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Storage Facility South',
    latitude: 40.3821,
    longitude: -3.7123,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Chamartín Branch',
    latitude: 40.4612,
    longitude: -3.6845,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Plaza del Sol Office',
    latitude: 40.4169,
    longitude: -3.7033,
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Demo Office',
    latitude: 10.4806,
    longitude: -66.9036,
    timezone: 'America/Caracas',
  },
  {
    name: 'Main Warehouse',
    latitude: 10.4923,
    longitude: -66.8902,
    timezone: 'America/Caracas',
  },
  {
    name: 'North Campus',
    latitude: 10.5021,
    longitude: -66.9289,
    timezone: 'America/Caracas',
  },
  {
    name: 'Tech Hub',
    latitude: 10.4747,
    longitude: -66.8756,
    timezone: 'America/Caracas',
  },
  {
    name: 'Distribution Center',
    latitude: 10.4312,
    longitude: -66.8412,
    timezone: 'America/Caracas',
  },
  {
    name: 'Central Station Office',
    latitude: 10.4856,
    longitude: -66.8788,
    timezone: 'America/Caracas',
  },
  {
    name: 'Retail Store Alpha',
    latitude: 10.4598,
    longitude: -66.8734,
    timezone: 'America/Caracas',
  },
  {
    name: 'Storage Facility South',
    latitude: 10.3821,
    longitude: -66.9123,
    timezone: 'America/Caracas',
  },
  {
    name: 'Las Mercedes Branch',
    latitude: 10.4812,
    longitude: -66.8545,
    timezone: 'America/Caracas',
  },
  {
    name: 'Altamira Office',
    latitude: 10.4969,
    longitude: -66.8533,
    timezone: 'America/Caracas',
  },
];

export async function seedPlaces(prisma: PrismaClient): Promise<void> {
  for (const place of PLACES) {
    const existing = await prisma.place.findFirst({
      where: { name: place.name },
    });
    if (!existing) {
      await prisma.place.create({ data: place });
      console.log(`Created place: ${place.name}`);
    }
  }
}
