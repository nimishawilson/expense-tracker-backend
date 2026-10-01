import {
  Body,
  Controller,
  Get,
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
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementQueryDto } from './dto/settlement-query.dto';
import { SettlementResponseDto } from './dto/settlement-response.dto';
import { SettlementService } from './settlement.service';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('settlements')
@ApiBearerAuth('access-token')
@Controller('settlements')
@UseGuards(JwtAuthGuard)
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post()
  @ApiOperation({ summary: 'Record a settlement between two users' })
  @ApiCreatedResponse({
    description: 'Settlement recorded',
    type: SettlementResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'You must be a party to this settlement',
  })
  @ApiNotFoundResponse({ description: 'From or to user not found' })
  @ApiBadRequestResponse({
    description: 'fromUserId and toUserId must differ, or invalid amount',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSettlementDto) {
    return this.settlementService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List settlements the user is a party to' })
  @ApiOkResponse({ description: 'Paginated settlement list' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: SettlementQueryDto,
  ) {
    return this.settlementService.findAll(req.user.id, query);
  }
}
