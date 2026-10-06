import { Module } from '@nestjs/common';
import { FriendRequestController } from './friend-request.controller';
import { FriendRequestTokenController } from './friend-request-token.controller';
import { FriendRequestService } from './friend-request.service';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';

@Module({
  // Token controller first: its static `token/...` routes must be registered
  // before FriendRequestController's `:id/...` routes.
  controllers: [
    FriendRequestTokenController,
    FriendRequestController,
    FriendController,
  ],
  providers: [FriendService, FriendRequestService],
  exports: [FriendService],
})
export class FriendModule {}
