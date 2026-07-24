import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { IncomeModule } from './income/income.module';

@Module({
  imports: [ClientsModule, ProjectsModule, IncomeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
