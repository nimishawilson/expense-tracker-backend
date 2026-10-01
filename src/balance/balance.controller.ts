import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BalanceService } from './balance.service';
import { BalancesResponseDto } from './dto/balances-response.dto';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('balances')
@ApiBearerAuth('access-token')
@Controller('balances')
@UseGuards(JwtAuthGuard)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @ApiOperation({
    summary: "Get the current user's balances: who they owe and who owes them",
  })
  @ApiOkResponse({ type: BalancesResponseDto })
  getBalances(@Req() req: AuthenticatedRequest) {
    return this.balanceService.getBalances(req.user.id);
  }
}
