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
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { PlacesSpacesQueryDto } from './dto/places-spaces-query.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@ApiTags('places')
@ApiSecurity('api-key')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new place' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'latitude', 'longitude'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
        timezone: { type: 'string', maxLength: 50, example: 'Europe/Madrid', description: 'IANA timezone (default: UTC)' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Place successfully created',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 201,
        message: 'Place created successfully',
        data: {
          id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          name: 'Main Office',
          latitude: 40.4168,
          longitude: -3.7038,
          timezone: 'Europe/Madrid',
          createdAt: '2026-03-21T22:00:00.000Z',
          updatedAt: '2026-03-21T22:00:00.000Z',
          spaceCount: 0,
          totalCapacity: 0,
        },
        timestamp: '2026-03-21T22:00:00.000Z',
        path: '/places',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 409,
    description: 'A place with this name already exists',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Place created successfully', 201)
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placesService.create(createPlaceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all places' })
  @ApiResponse({
    status: 200,
    description: 'List of all places with spaceCount and totalCapacity',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Places retrieved successfully',
        data: [
          {
            id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            name: 'Demo Office',
            latitude: 40.4168,
            longitude: -3.7038,
            timezone: 'Europe/Madrid',
            createdAt: '2026-03-21T22:00:00.000Z',
            updatedAt: '2026-03-21T22:00:00.000Z',
            spaceCount: 3,
            totalCapacity: 30,
          },
        ],
        timestamp: '2026-03-21T22:00:00.000Z',
        path: '/places',
      },
    },
  })
  @SuccessMessage('Places retrieved successfully')
  findAll() {
    return this.placesService.findAll();
  }

  @Get(':placeId/spaces')
  @ApiOperation({ summary: 'Get all spaces for a place (paginated)' })
  @ApiParam({ name: 'placeId', description: 'Place ID (CUID)' })
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
    enum: ['name', 'capacity'],
    description: 'Sort by field (default: name)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction (default: asc)',
  })
  @ApiResponse({
    status: 200,
    description:
    'Paginated list of spaces belonging to the place (up to 3 upcoming reservations per space)',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Spaces retrieved successfully',
        data: {
          place: {
            id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            name: 'Demo Office',
            latitude: 40.4168,
            longitude: -3.7038,
            timezone: 'Europe/Madrid',
            createdAt: '2026-03-21T22:00:00.000Z',
            updatedAt: '2026-03-21T22:00:00.000Z',
            totalSpaces: 5,
          },
          items: [
            {
              id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
              name: 'Meeting Room A',
              reference: 'MRA-01',
              capacity: 6,
              description: 'Main meeting room',
              createdAt: '2026-03-21T22:00:00.000Z',
              updatedAt: '2026-03-21T22:00:00.000Z',
              reservationCount: 3,
              reservations: [
                {
                  id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
                  clientEmail: 'client@example.com',
                  startAt: '2026-03-28T09:00:00.000Z',
                  endAt: '2026-03-28T11:00:00.000Z',
                  createdAt: '2026-03-21T22:00:00.000Z',
                  updatedAt: '2026-03-21T22:00:00.000Z',
                },
              ],
            },
          ],
          meta: {
            page: 1,
            pageSize: 10,
            total: 5,
            totalPages: 1,
            sortBy: 'name',
            sortOrder: 'asc',
          },
        },
        timestamp: '2026-03-21T22:00:00.000Z',
        path: '/places/clxxxxxxxxxxxxxxxxxxxxxxxxx/spaces',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Place not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Spaces retrieved successfully')
  findSpacesByPlaceId(
    @Param('placeId') placeId: string,
    @Query() query: PlacesSpacesQueryDto,
  ) {
    return this.placesService.findSpacesByPlaceId(placeId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a place by ID' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiResponse({
    status: 200,
    description: 'Place found with spaceCount and totalCapacity',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Place retrieved successfully',
        data: {
          id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          name: 'Demo Office',
          latitude: 40.4168,
          longitude: -3.7038,
          timezone: 'Europe/Madrid',
          createdAt: '2026-03-21T22:00:00.000Z',
          updatedAt: '2026-03-21T22:00:00.000Z',
          spaceCount: 3,
          totalCapacity: 30,
        },
        timestamp: '2026-03-21T22:00:00.000Z',
        path: '/places/clxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Place not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Place retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a place' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
        timezone: { type: 'string', maxLength: 50, example: 'Europe/Madrid' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Place updated',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Place not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Place updated successfully')
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placesService.update(id, updatePlaceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a place' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiResponse({
    status: 200,
    description: 'Place deleted',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Place not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Place deleted successfully')
  remove(@Param('id') id: string) {
    return this.placesService.remove(id);
  }
}
