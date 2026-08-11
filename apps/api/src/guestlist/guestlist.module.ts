import { Module } from "@nestjs/common";
import { GuestlistController } from "./guestlist.controller";
import { GuestlistService } from "./guestlist.service";

@Module({ controllers: [GuestlistController], providers: [GuestlistService] })
export class GuestlistModule {}
