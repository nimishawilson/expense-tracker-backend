import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FriendTokenDto } from './dto/friend-token.dto';
import {
  FriendRequestResponseDto,
  FriendRequestTokenDetailsDto,
} from './dto/friend-request-response.dto';
import { FriendRequestService } from './friend-request.service';

/**
 * Public endpoints used by the page the email link opens. The token is the
 * credential, so these are POST (link scanners only issue GET) and throttled
 * per IP. This controller must be registered before FriendRequestController so
 * `token/...` is not captured by its `:id/...` routes.
 */
@ApiTags('friend-requests')
@Controller('friend-requests/token')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class FriendRequestTokenController {
  constructor(private readonly requests: FriendRequestService) {}

  @Post('details')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Show who sent the request, for the email landing page (public)',
  })
  @ApiOkResponse({ type: FriendRequestTokenDetailsDto })
  @ApiNotFoundResponse({ description: 'Unknown token' })
  details(@Body() dto: FriendTokenDto) {
    return this.requests.tokenDetails(dto.token);
  }

  @Post('accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept a request from the email link (public)' })
  @ApiOkResponse({ type: FriendRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Unknown token' })
  @ApiGoneResponse({ description: 'Request expired' })
  @ApiConflictResponse({
    description:
      'Already responded, or code REGISTRATION_REQUIRED when the email has no account yet',
  })
  accept(@Body() dto: FriendTokenDto) {
    return this.requests.respondByToken(dto.token, 'accept');
  }

  @Post('reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Decline a request from the email link (public)' })
  @ApiOkResponse({ type: FriendRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Unknown token' })
  @ApiGoneResponse({ description: 'Request expired' })
  @ApiConflictResponse({ description: 'Already responded' })
  reject(@Body() dto: FriendTokenDto) {
    return this.requests.respondByToken(dto.token, 'reject');
  }
}
