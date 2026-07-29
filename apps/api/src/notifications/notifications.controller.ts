import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('overdue-income')
  async overdueIncome(@CurrentUser() user: AuthUser) {
    const data = await this.notificationsService.getOverdueIncome(user.userId);
    return { data };
  }
}
