import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './create-employee.dto';
import { JwtAuthGuard } from '../jwt/auth.guard';
import { Employee } from './employee.interface';
import { UpdateEmployeeDto } from './update-employee.dto';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllEmployees(): Promise<any[]> {
    return this.employeeService.getAllEmployees();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchEmployeesByEmail(@Query('query') query: string): Promise<any[]> {
    return this.employeeService.searchEmployeesByEmail(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<any> {
    await this.employeeService.createEmployee(createEmployeeDto);

    delete createEmployeeDto.password;

    return {
      message: 'Employee created successfully',
      employee: createEmployeeDto,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getEmployeeById(@Param('id') id: string): Promise<any> {
    return this.employeeService.getEmployeeById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employeeService.updateEmployee(id, updateEmployeeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteEmployee(@Param('id') id: string): Promise<any> {
    await this.employeeService.deleteEmployee(id);

    return {
      message: 'Employee deleted successfully.',
    };
  }
}
