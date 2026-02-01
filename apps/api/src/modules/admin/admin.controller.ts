import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('store-config')
  @ApiOperation({ summary: 'Get store configuration' })
  async getStoreConfig() {
    return this.adminService.getStoreConfig();
  }

  @Put('store-config')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update store configuration' })
  async updateStoreConfig(@Body() body: any) {
    return this.adminService.updateStoreConfig(body);
  }

  @Get('reports/sales')
  @ApiOperation({ summary: 'Get sales report' })
  async getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getSalesReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reports/inventory')
  @ApiOperation({ summary: 'Get inventory report' })
  async getInventoryReport() {
    return this.adminService.getInventoryReport();
  }
}
