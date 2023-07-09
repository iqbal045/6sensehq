import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: { email: string; password: string },
  ): Promise<{ token: string }> {
    const { email, password } = loginDto;
    const token = await this.authService.login(email, password);
    return { token };
  }
}
