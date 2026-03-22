import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@ApiSecurity('api-key')
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @SuccessMessage('Space created successfully', 201)
  create(@Body() createSpaceDto: CreateSpaceDto) {
    return this.spacesService.create(createSpaceDto);
  }

  @Get()
  @SuccessMessage('Spaces retrieved successfully')
  findAll() {
    return this.spacesService.findAll();
  }

  @Get(':id')
  @SuccessMessage('Space retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  @Patch(':id')
  @SuccessMessage('Space updated successfully')
  update(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto) {
    return this.spacesService.update(id, updateSpaceDto);
  }

  @Delete(':id')
  @SuccessMessage('Space deleted successfully')
  remove(@Param('id') id: string) {
    return this.spacesService.remove(id);
  }
}
