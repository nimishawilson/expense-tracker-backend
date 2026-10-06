import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { FriendRequestQueryDto } from './dto/friend-request-query.dto';
import {
  FriendRequestListResponseDto,
  FriendRequestResponseDto,
} from './dto/friend-request-response.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendRequestService } from './friend-request.service';
import { UserThrottlerGuard } from './user-throttler.guard';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('friend-requests')
@ApiBearerAuth('access-token')
@Controller('friend-requests')
@UseGuards(JwtAuthGuard)
export class FriendRequestController {
  constructor(private readonly requests: FriendRequestService) {}

  @Post()
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60 * 60_000 } })
  @ApiOperation({
    summary:
      'Send a friend request by email. The response is identical whether or not the email has an account.',
  })
  @ApiCreatedResponse({ type: FriendRequestResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid email or request to self' })
  @ApiConflictResponse({
    description: 'Already friends, or declined recently',
  })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  send(@Req() req: AuthenticatedRequest, @Body() dto: SendFriendRequestDto) {
    return this.requests.send(req.user, dto.email);
  }

  @Get()
  @ApiOperation({
    summary:
      'List friend requests: incoming (default, pending) for the in-app inbox, or outgoing',
  })
  @ApiOkResponse({ type: FriendRequestListResponseDto })
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: FriendRequestQueryDto,
  ) {
    return this.requests.list(req.user, query);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept an incoming request' })
  @ApiOkResponse({ type: FriendRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Not an incoming request of yours' })
  @ApiGoneResponse({ description: 'Request expired' })
  @ApiConflictResponse({ description: 'Already responded' })
  accept(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.requests.respond(req.user, id, 'accept');
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reject an incoming request' })
  @ApiOkResponse({ type: FriendRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Not an incoming request of yours' })
  @ApiGoneResponse({ description: 'Request expired' })
  @ApiConflictResponse({ description: 'Already responded' })
  reject(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.requests.respond(req.user, id, 'reject');
  }

  @Post(':id/resend')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Resend the email for a pending request you sent (new link, fresh expiry)',
  })
  @ApiOkResponse({ type: FriendRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Not a request you sent' })
  @ApiConflictResponse({ description: 'Request is no longer pending' })
  @ApiTooManyRequestsResponse({ description: 'Cooldown or send limit reached' })
  resend(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.requests.resend(req.user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending request you sent' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Not a request you sent' })
  @ApiConflictResponse({ description: 'Request is no longer pending' })
  cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.requests.cancel(req.user, id);
  }
}
