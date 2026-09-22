import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { toSafeUser } from '../common/utils/sanitize-user';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private async findUserOrThrow(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getProfile(userId: number) {
    const user = await this.findUserOrThrow(userId);
    return toSafeUser(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    await this.findUserOrThrow(userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return toSafeUser(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.findUserOrThrow(userId);

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }
}
