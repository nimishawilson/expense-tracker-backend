import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';
const FOREIGN_KEY_CONSTRAINT_ERROR_CODE = 'P2003';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async findVisibleOrThrow(id: number, userId: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || (!category.isDefault && category.userId !== userId)) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findAllForUser(userId: number) {
    return this.prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number, userId: number) {
    return this.findVisibleOrThrow(id, userId);
  }

  async create(userId: number, dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: { ...dto, userId, isDefault: false },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_ERROR_CODE
      ) {
        throw new ConflictException(
          'You already have a category with this name',
        );
      }
      throw error;
    }
  }

  async update(id: number, userId: number, dto: UpdateCategoryDto) {
    const category = await this.findVisibleOrThrow(id, userId);
    if (category.isDefault) {
      throw new ForbiddenException('Default categories cannot be modified');
    }

    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_ERROR_CODE
      ) {
        throw new ConflictException(
          'You already have a category with this name',
        );
      }
      throw error;
    }
  }

  async remove(id: number, userId: number) {
    const category = await this.findVisibleOrThrow(id, userId);
    if (category.isDefault) {
      throw new ForbiddenException('Default categories cannot be deleted');
    }

    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === FOREIGN_KEY_CONSTRAINT_ERROR_CODE
      ) {
        throw new ConflictException(
          'Cannot delete a category that is used by existing expenses',
        );
      }
      throw error;
    }

    return { message: 'Category deleted successfully' };
  }
}
