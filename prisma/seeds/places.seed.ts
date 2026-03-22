import type { PrismaClient } from '../../generated/prisma/client.js';

const PLACES = [
  { name: 'Demo Office', latitude: 40.4168, longitude: -3.7038 },
  { name: 'Main Warehouse', latitude: 40.4378, longitude: -3.6917 },
  { name: 'North Campus', latitude: 40.4521, longitude: -3.7289 },
  { name: 'Tech Hub', latitude: 40.4247, longitude: -3.6856 },
  { name: 'Distribution Center', latitude: 40.4012, longitude: -3.6612 },
  { name: 'Central Station Office', latitude: 40.4056, longitude: -3.6888 },
  { name: 'Retail Store Alpha', latitude: 40.4298, longitude: -3.7034 },
  { name: 'Storage Facility South', latitude: 40.3821, longitude: -3.7123 },
  { name: 'Chamartín Branch', latitude: 40.4612, longitude: -3.6845 },
  { name: 'Plaza del Sol Office', latitude: 40.4169, longitude: -3.7033 },
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
