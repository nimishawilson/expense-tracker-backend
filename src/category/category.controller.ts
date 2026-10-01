import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('categories')
@ApiBearerAuth('access-token')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a custom category' })
  @ApiCreatedResponse({
    description: 'Category created',
    type: CategoryResponseDto,
  })
  @ApiConflictResponse({
    description: 'A category with this name already exists',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List default and owned custom categories' })
  @ApiOkResponse({ description: 'Category list', type: [CategoryResponseDto] })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.categoryService.findAllForUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({
    description: 'Category not found or not visible to this user',
  })
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoryService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned custom category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiForbiddenResponse({
    description: 'Default categories cannot be modified',
  })
  @ApiNotFoundResponse({
    description: 'Category not found or not visible to this user',
  })
  @ApiConflictResponse({
    description: 'A category with this name already exists',
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an owned custom category' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiForbiddenResponse({ description: 'Default categories cannot be deleted' })
  @ApiNotFoundResponse({
    description: 'Category not found or not visible to this user',
  })
  @ApiConflictResponse({ description: 'Category is used by existing expenses' })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoryService.remove(id, req.user.id);
  }
}
