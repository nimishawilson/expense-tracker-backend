import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary:
      "Get the user's total spent for a month (defaults to the current month)",
  })
  @ApiOkResponse({ type: DashboardSummaryResponseDto })
  getSummary(
    @Req() req: AuthenticatedRequest,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.dashboardService.getSummary(req.user.id, query);
  }
}
