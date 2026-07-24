import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { IncomeModule } from './income/income.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';

@Module({
  imports: [
    FirebaseModule,
    ClientsModule,
    ProjectsModule,
    IncomeModule,
    ExpensesModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: FirebaseAuthGuard }],
})
export class AppModule {}
