import type { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Space definitions keyed by place name.
 * These will be created for places seeded by places.seed.ts.
 */
const SPACES_BY_PLACE: Record<
  string,
  Array<{ name: string; reference?: string; capacity: number; description?: string }>
> = {
  'Demo Office': [
    { name: 'Meeting Room A', reference: 'MRA-01', capacity: 6, description: 'Main meeting room' },
    { name: 'Meeting Room B', reference: 'MRB-02', capacity: 4, description: 'Small meeting room' },
    { name: 'Open Area', reference: 'OA-01', capacity: 20, description: 'Shared workspace' },
  ],
  'Main Warehouse': [
    { name: 'Loading Bay', reference: 'LB-01', capacity: 10, description: 'Loading and unloading area' },
    { name: 'Office Section', reference: 'OS-01', capacity: 8, description: 'Warehouse office space' },
  ],
  'North Campus': [
    { name: 'Conference Room', reference: 'CR-01', capacity: 12, description: 'Main conference room' },
    { name: 'Flex Space', reference: 'FS-01', capacity: 25, description: 'Flexible event space' },
  ],
  'Tech Hub': [
    { name: 'Lab 1', reference: 'LAB-01', capacity: 12, description: 'Development lab' },
    { name: 'Lab 2', reference: 'LAB-02', capacity: 8, description: 'Testing lab' },
    { name: 'Conference Room', reference: 'CR-01', capacity: 15, description: 'Main conference room' },
  ],
  'Distribution Center': [
    { name: 'Dispatch Area', reference: 'DA-01', capacity: 15, description: 'Dispatch and shipping' },
    { name: 'Break Room', reference: 'BR-01', capacity: 20, description: 'Staff break area' },
  ],
  'Central Station Office': [
    { name: 'Meeting Room 1', reference: 'MR1-01', capacity: 8, description: 'Meeting room' },
    { name: 'Meeting Room 2', reference: 'MR2-02', capacity: 6, description: 'Meeting room' },
    { name: 'Coworking Area', reference: 'CA-01', capacity: 30, description: 'Open coworking space' },
  ],
  'Retail Store Alpha': [
    { name: 'Back Office', reference: 'BO-01', capacity: 4, description: 'Administrative space' },
    { name: 'Storage Room', reference: 'SR-01', capacity: 6, description: 'Storage and inventory' },
  ],
  'Storage Facility South': [
    { name: 'Office Pod', reference: 'OP-01', capacity: 4, description: 'On-site office' },
    { name: 'Meeting Space', reference: 'MS-01', capacity: 6, description: 'Small meeting area' },
  ],
  'Chamartín Branch': [
    { name: 'Meeting Room A', reference: 'MRA-01', capacity: 8, description: 'Branch meeting room' },
    { name: 'Meeting Room B', reference: 'MRB-02', capacity: 4, description: 'Small meeting room' },
    { name: 'Work Area', reference: 'WA-01', capacity: 12, description: 'Shared work area' },
  ],
  'Plaza del Sol Office': [
    { name: 'Main Conference', reference: 'MC-01', capacity: 20, description: 'Main conference room' },
    { name: 'Hot Desk Zone', reference: 'HD-01', capacity: 25, description: 'Hot desking area' },
  ],
  'Las Mercedes Branch': [
    { name: 'Meeting Room A', reference: 'MRA-01', capacity: 8, description: 'Branch meeting room' },
    { name: 'Meeting Room B', reference: 'MRB-02', capacity: 4, description: 'Small meeting room' },
    { name: 'Work Area', reference: 'WA-01', capacity: 12, description: 'Shared work area' },
  ],
  'Altamira Office': [
    { name: 'Main Conference', reference: 'MC-01', capacity: 20, description: 'Main conference room' },
    { name: 'Hot Desk Zone', reference: 'HD-01', capacity: 25, description: 'Hot desking area' },
  ],
};

export async function seedSpaces(prisma: PrismaClient): Promise<void> {
  const places = await prisma.place.findMany();
  if (places.length === 0) {
    console.log('No places found. Run places seeder first.');
    return;
  }

  const placeByName = new Map(places.map((p) => [p.name, p]));
  let created = 0;

  for (const [placeName, spaceDefs] of Object.entries(SPACES_BY_PLACE)) {
    const place = placeByName.get(placeName);
    if (!place) {
      console.log(`Place "${placeName}" not found, skipping its spaces`);
      continue;
    }

    for (const def of spaceDefs) {
      const existing = await prisma.space.findFirst({
        where: { placeId: place.id, name: def.name },
      });
      if (!existing) {
        await prisma.space.create({
          data: {
            placeId: place.id,
            name: def.name,
            reference: def.reference,
            capacity: def.capacity,
            description: def.description,
          },
        });
        created++;
        console.log(`Created space: ${def.name} (${placeName})`);
      }
    }
  }

  console.log(`Spaces seeding complete. Created ${created} spaces.`);
}
