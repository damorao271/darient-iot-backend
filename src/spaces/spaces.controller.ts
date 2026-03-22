import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@ApiSecurity('api-key')
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
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
  @ApiResponse({
    status: 200,
    description: 'Space updated',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Space updated successfully')
  update(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto) {
    return this.spacesService.update(id, updateSpaceDto);
  }

  @Delete(':id')
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
