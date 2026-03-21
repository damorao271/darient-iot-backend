export class CreateReservationDto {
  spaceId!: string;
  placeId?: string;
  clientEmail!: string;
  reservationDate!: Date;
  startTime!: string;
  endTime!: string;
}
