import { Module } from '@nestjs/common';
import { OrderService } from './services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';

@Module({
  providers: [OrderService],
  exports: [OrderService],
  imports: [TypeOrmModule.forFeature([OrderEntity])],
})
export class OrderModule {}
