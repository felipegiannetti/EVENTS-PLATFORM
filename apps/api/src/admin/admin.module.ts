import { Module } from "@nestjs/common";
import { SecurityModule } from "../security/security.module";
import { FinanceModule } from "../finance/finance.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [SecurityModule, FinanceModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
