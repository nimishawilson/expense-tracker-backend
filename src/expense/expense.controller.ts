import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { SplitPreviewDto } from './dto/split-preview.dto';
import { SplitPreviewResponseDto } from './dto/split-preview-response.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseService } from './expense.service';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('expenses')
@ApiBearerAuth('access-token')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new expense, optionally split among participants',
  })
  @ApiCreatedResponse({
    description: 'Expense created',
    type: ExpenseResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Category or paid-by user not found' })
  @ApiBadRequestResponse({
    description: 'Validation or split-calculation error',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateExpenseDto) {
    return this.expenseService.create(req.user.id, dto);
  }

  @Post('split-preview')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Preview split shares without saving, using the same rules as create/update',
  })
  @ApiOkResponse({ type: SplitPreviewResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation, unknown participant, or split-calculation error',
  })
  previewSplit(@Body() dto: SplitPreviewDto) {
    return this.expenseService.previewSplit(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses the user owns or participates in' })
  @ApiOkResponse({ description: 'Paginated expense list' })
  findAll(@Req() req: AuthenticatedRequest, @Query() query: ExpenseQueryDto) {
    return this.expenseService.findAll(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense (owner or participant only)' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiNotFoundResponse({
    description: 'Expense not found or not visible to this user',
  })
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expenseService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an expense (owner only); recalculates splits when needed',
  })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiForbiddenResponse({ description: 'Only the owner may edit' })
  @ApiNotFoundResponse({
    description: 'Expense not found or not visible to this user',
  })
  @ApiBadRequestResponse({
    description: 'Validation or split-calculation error',
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense (owner only)' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiForbiddenResponse({ description: 'Only the owner may delete' })
  @ApiNotFoundResponse({
    description: 'Expense not found or not visible to this user',
  })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expenseService.remove(id, req.user.id);
  }
}
