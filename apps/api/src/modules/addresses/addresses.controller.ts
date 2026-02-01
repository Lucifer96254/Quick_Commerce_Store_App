import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user addresses' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.addressesService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.addressesService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create address' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: {
      label?: string;
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      landmark?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    },
  ) {
    return this.addressesService.create(userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update address' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.addressesService.update(id, userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.addressesService.delete(id, userId);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set as default address' })
  async setDefault(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.addressesService.setDefault(id, userId);
  }
}
