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
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
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
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Place successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'A place with this name already exists' })
  @SuccessMessage('Place created successfully', 201)
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placesService.create(createPlaceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all places' })
  @ApiResponse({ status: 200, description: 'List of all places' })
  @SuccessMessage('Places retrieved successfully')
  findAll() {
    return this.placesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a place by ID' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiResponse({ status: 200, description: 'Place found' })
  @ApiResponse({ status: 404, description: 'Place not found' })
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
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Place updated' })
  @ApiResponse({ status: 404, description: 'Place not found' })
  @SuccessMessage('Place updated successfully')
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placesService.update(id, updatePlaceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a place' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiResponse({ status: 200, description: 'Place deleted' })
  @ApiResponse({ status: 404, description: 'Place not found' })
  @SuccessMessage('Place deleted successfully')
  remove(@Param('id') id: string) {
    return this.placesService.remove(id);
  }
}
