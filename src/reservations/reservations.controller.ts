import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@ApiSecurity('api-key')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @SuccessMessage('Reservation created successfully', 201)
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  @SuccessMessage('Reservations retrieved successfully')
  findAll(@Query() query: PaginationQueryDto) {
    return this.reservationsService.findAll(query);
  }

  @Get(':id')
  @SuccessMessage('Reservation retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @SuccessMessage('Reservation updated successfully')
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Delete(':id')
  @SuccessMessage('Reservation deleted successfully')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
