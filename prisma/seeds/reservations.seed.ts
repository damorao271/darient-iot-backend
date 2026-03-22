import { addDays, format } from 'date-fns';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { localToUtc } from '../../src/common/utils/timezone.utils.js';

type ReservationDef = {
  placeName: string;
  spaceName: string;
  clientEmail: string;
  daysAhead: number;
  startTime: string;
  endTime: string;
};

const RESERVATIONS: ReservationDef[] = [
  { placeName: 'Demo Office', spaceName: 'Meeting Room A', clientEmail: 'alice@example.com', daysAhead: 1, startTime: '09:00', endTime: '10:30' },
  { placeName: 'Demo Office', spaceName: 'Meeting Room A', clientEmail: 'bob@example.com', daysAhead: 1, startTime: '11:00', endTime: '12:00' },
  { placeName: 'Demo Office', spaceName: 'Meeting Room B', clientEmail: 'alice@example.com', daysAhead: 1, startTime: '14:00', endTime: '15:00' },
  { placeName: 'Main Warehouse', spaceName: 'Loading Bay', clientEmail: 'carol@example.com', daysAhead: 1, startTime: '08:00', endTime: '09:00' },
  { placeName: 'North Campus', spaceName: 'Conference Room', clientEmail: 'bob@example.com', daysAhead: 2, startTime: '10:00', endTime: '12:00' },
  { placeName: 'Tech Hub', spaceName: 'Lab 1', clientEmail: 'alice@example.com', daysAhead: 2, startTime: '09:00', endTime: '11:00' },
  { placeName: 'Demo Office', spaceName: 'Open Area', clientEmail: 'dave@example.com', daysAhead: 3, startTime: '13:00', endTime: '17:00' },
  { placeName: 'Central Station Office', spaceName: 'Meeting Room 1', clientEmail: 'frank@example.com', daysAhead: 4, startTime: '10:00', endTime: '11:00' },
  { placeName: 'Chamartín Branch', spaceName: 'Meeting Room A', clientEmail: 'grace@example.com', daysAhead: 5, startTime: '15:00', endTime: '16:30' },
  { placeName: 'Plaza del Sol Office', spaceName: 'Main Conference', clientEmail: 'helen@example.com', daysAhead: 6, startTime: '09:00', endTime: '10:00' },
];

export async function seedReservations(prisma: PrismaClient): Promise<void> {
  const places = await prisma.place.findMany({ select: { id: true, name: true, timezone: true } });
  const spaces = await prisma.space.findMany({
    select: { id: true, placeId: true, name: true, place: { select: { timezone: true } } },
  });

  if (places.length === 0 || spaces.length === 0) {
    console.log('No places or spaces found. Run places and spaces seeders first.');
    return;
  }

  const placeByName = new Map(places.map((p) => [p.name, p]));

  const today = new Date();
  let created = 0;
  for (const def of RESERVATIONS) {
    const place = placeByName.get(def.placeName);
    const space = spaces.find(
      (s) => s.placeId === place?.id && s.name === def.spaceName,
    );
    if (!place || !space) {
      console.log(
        `Skipping reservation: place "${def.placeName}" or space "${def.spaceName}" not found`,
      );
      continue;
    }

    const reservationDate = format(addDays(today, def.daysAhead), 'yyyy-MM-dd');
    const timezone = space.place?.timezone ?? 'UTC';
    const startAt = localToUtc(reservationDate, def.startTime, timezone);
    const endAt = localToUtc(reservationDate, def.endTime, timezone);

    const overlapping = await prisma.reservation.findFirst({
      where: {
        spaceId: space.id,
        OR: [
          {
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        ],
      },
    });
    if (overlapping) continue;

    await prisma.reservation.create({
      data: {
        spaceId: space.id,
        placeId: place.id,
        clientEmail: def.clientEmail,
        startAt,
        endAt,
      },
    });
    created++;
    console.log(
      `Created reservation: ${def.clientEmail} @ ${def.placeName}/${def.spaceName} ${reservationDate} ${def.startTime}-${def.endTime}`,
    );
  }

  console.log(`Reservations seeding complete. Created ${created} reservations.`);
}
