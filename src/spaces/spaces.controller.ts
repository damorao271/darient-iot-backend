import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
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
  @ApiOperation({ summary: 'Get all spaces' })
  @ApiResponse({
    status: 200,
    description: 'List of all spaces',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @SuccessMessage('Spaces retrieved successfully')
  findAll() {
    return this.spacesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a space by ID' })
  @ApiParam({ name: 'id', description: 'Space ID (CUID)' })
  @ApiResponse({
    status: 200,
    description: 'Space found',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Space retrieved successfully')
  findOne(@Param('id') id: string) {
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
  update(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto) {
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
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Space deleted successfully')
  remove(@Param('id') id: string) {
    return this.spacesService.remove(id);
  }
}
