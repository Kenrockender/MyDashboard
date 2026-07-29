import { Controller, Get, Query } from '@nestjs/common';
import { TaxService } from './tax.service';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller('tax')
export class TaxController {
  constructor(private taxService: TaxService) {}

  @Get('pph-umkm')
  async pphUmkm(@Query('year') year: string | undefined, @CurrentUser() user: AuthUser) {
    const parsedYear = year ? Number(year) : new Date().getUTCFullYear();
    const data = await this.taxService.getPphUmkmEstimate(user.userId, parsedYear);
    return { data };
  }
}
