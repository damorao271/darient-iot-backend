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
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { SpacesQueryDto } from './dto/spaces-query.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@ApiTags('spaces')
@ApiSecurity('api-key')
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new space' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['placeId', 'name', 'capacity'],
      properties: {
        placeId: { type: 'string', description: 'CUID of the parent place' },
        name: { type: 'string', minLength: 1, maxLength: 100 },
        reference: { type: 'string', maxLength: 500 },
        capacity: { type: 'integer', minimum: 1 },
        description: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Space created successfully',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Place not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 409,
    description: 'A space with this name already exists in this place',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Space created successfully', 201)
  create(@Body() createSpaceDto: CreateSpaceDto) {
    return this.spacesService.create(createSpaceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all spaces (paginated)' })
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
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by name (partial, case-insensitive match)',
  })
  @ApiQuery({
    name: 'hasReservations',
    required: false,
    enum: ['true', 'false'],
    description:
      'Filter by reservation status: true = only spaces with reservations, false = only spaces without reservations',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of spaces with place and reservations',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Spaces retrieved successfully',
        data: {
          items: [
            {
              id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
              placeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
              name: 'Meeting Room A',
              reference: 'MRA-01',
              capacity: 6,
              description: 'Main meeting room',
              place: {
                id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
                name: 'Demo Office',
                latitude: 40.4168,
                longitude: -3.7038,
              },
              reservations: [],
            },
          ],
          meta: {
            page: 1,
            pageSize: 10,
            total: 25,
            totalPages: 3,
            sortBy: 'name',
            sortOrder: 'asc',
          },
        },
        timestamp: '2026-03-21T22:00:00.000Z',
        path: '/spaces',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for query params',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Spaces retrieved successfully')
  findAll(@Query() query: SpacesQueryDto) {
    return this.spacesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a space by ID' })
  @ApiParam({ name: 'id', description: 'Space ID (CUID)' })
  @ApiResponse({
    status: 200,
    description: 'Space found',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Space retrieved successfully',
        data: {
          id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          placeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          name: 'Meeting Room A',
          reference: 'MRA-01',
          capacity: 6,
          description: 'Main meeting room',
          place: {
            id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            name: 'Demo Office',
            latitude: 40.4168,
            longitude: -3.7038,
          },
          reservations: [],
        },
        timestamp: '2026-03-21T22:00:00.000Z',
        path: '/spaces/clxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID format',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Space retrieved successfully')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.spacesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a space' })
  @ApiParam({ name: 'id', description: 'Space ID (CUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        placeId: { type: 'string', description: 'CUID of the parent place' },
        name: { type: 'string', minLength: 1, maxLength: 100 },
        reference: { type: 'string', maxLength: 500 },
        capacity: { type: 'integer', minimum: 1 },
        description: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Space updated successfully',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space or place not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 409,
    description: 'A space with this name already exists in this place',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Space updated successfully')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
  ) {
    return this.spacesService.update(id, updateSpaceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a space' })
  @ApiParam({ name: 'id', description: 'Space ID (CUID)' })
  @ApiResponse({
    status: 200,
    description: 'Space deleted',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID format',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete space with active reservations',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Space deleted successfully')
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.spacesService.remove(id);
  }
}
