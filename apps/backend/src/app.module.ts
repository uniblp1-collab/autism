import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { RequestIdMiddleware } from "./common/logger/request-id.middleware";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/presentation/auth.module";
import { ChildrenModule } from "./modules/children/presentation/children.module";
import { CategoriesModule } from "./modules/categories/presentation/categories.module";
import { CardsModule } from "./modules/cards/presentation/cards.module";
import { FavoritesModule } from "./modules/favorites/presentation/favorites.module";
import { HistoryModule } from "./modules/history/presentation/history.module";
import { ScheduleModule } from "./modules/schedule/presentation/schedule.module";
import { StatisticsModule } from "./modules/statistics/presentation/statistics.module";
import { AdminModule } from "./modules/admin/presentation/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET", "dev-access-secret"),
        signOptions: { expiresIn: config.get<string>("JWT_ACCESS_EXPIRES_IN", "15m") },
      }),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ChildrenModule,
    CategoriesModule,
    CardsModule,
    FavoritesModule,
    HistoryModule,
    ScheduleModule,
    StatisticsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
