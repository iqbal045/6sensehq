import { Controller, Get, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async createAdmin(): Promise<any> {
    await this.adminService.createAdmin();

    return { message: 'Admin created successfully' };
  }
}
