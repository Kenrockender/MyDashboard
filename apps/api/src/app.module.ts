import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { IncomeModule } from './income/income.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [ClientsModule, ProjectsModule, IncomeModule, ExpensesModule, DashboardModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
