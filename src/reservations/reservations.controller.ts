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
import { ApiResponse, ApiSecurity } from '@nestjs/swagger';
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
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 409,
    description:
      'Schedule conflict (space already reserved) or client exceeded 3 reservations per week',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Reservation created successfully', 201)
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Paginated list of reservations',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @SuccessMessage('Reservations retrieved successfully')
  findAll(@Query() query: PaginationQueryDto) {
    return this.reservationsService.findAll(query);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Reservation found',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Reservation retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Reservation updated',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation or space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 409,
    description:
      'Schedule conflict, invalid time range, or client exceeded 3 reservations per week',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Reservation updated successfully')
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Reservation deleted',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Reservation deleted successfully')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
