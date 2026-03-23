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
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsQueryDto } from './dto/reservations-query.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@ApiTags('reservations')
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
  @ApiOperation({ summary: 'Get all reservations (paginated)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['startAt', 'createdAt', 'clientEmail'],
    description: 'Sort by field (default: startAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction (default: asc)',
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    type: String,
    description: 'Filter by space CUID',
  })
  @ApiQuery({
    name: 'placeId',
    required: false,
    type: String,
    description: 'Filter by place CUID',
  })
  @ApiQuery({
    name: 'clientEmail',
    required: false,
    type: String,
    description: 'Filter by client email',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Filter reservations from this date (YYYY-MM-DD, UTC)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Filter reservations until this date (YYYY-MM-DD, UTC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of reservations',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (e.g. invalid date format, fromDate > toDate)',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 401,
    description: 'API key missing or invalid',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Reservations retrieved successfully')
  findAll(@Query() query: ReservationsQueryDto) {
    return this.reservationsService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Reservation ID (CUID)' })
  @ApiResponse({
    status: 200,
    description: 'Reservation found',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID format',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Reservation retrieved successfully')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Reservation ID (CUID)' })
  @ApiResponse({
    status: 200,
    description: 'Reservation updated',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID format',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
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
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiParam({ name: 'id', description: 'Reservation ID (CUID)' })
  @ApiResponse({
    status: 200,
    description: 'Reservation deleted',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID format',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 401,
    description: 'API key missing or invalid',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Reservation deleted successfully')
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.reservationsService.remove(id);
  }
}
