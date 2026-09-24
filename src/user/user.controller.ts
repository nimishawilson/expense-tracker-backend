import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UserResponseDto } from '../common/dto/user-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the authenticated user's profile" })
  @ApiOkResponse({ description: 'Current user profile', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: "Update the authenticated user's profile" })
  @ApiOkResponse({ description: 'Updated user profile', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: "Change the authenticated user's password" })
  @ApiOkResponse({
    description: 'Password changed successfully',
    type: MessageResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Current password is incorrect' })
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(req.user.id, dto);
  }
}
