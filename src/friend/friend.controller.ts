import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { FriendListResponseDto } from './dto/friend-response.dto';
import { FriendQueryDto } from './dto/friend-query.dto';
import { FriendService } from './friend.service';

type AuthenticatedRequest = Request & { user: { id: number; email: string } };

@ApiTags('friends')
@ApiBearerAuth('access-token')
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  @ApiOperation({
    summary:
      'List my friends, optionally filtered by name/email (feeds the participant and paid-by pickers)',
  })
  @ApiOkResponse({ type: FriendListResponseDto })
  list(@Req() req: AuthenticatedRequest, @Query() query: FriendQueryDto) {
    return this.friendService.list(req.user.id, query);
  }

  @Delete(':friendId')
  @ApiOperation({
    summary:
      'Remove a friend. Existing expenses, balances and settlements are kept.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Not a friend' })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    return this.friendService.remove(req.user.id, friendId);
  }
}
