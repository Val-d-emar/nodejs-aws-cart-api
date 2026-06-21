import { Injectable } from '@nestjs/common';
import { Order } from '../models';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async getAll(): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      relations: ['cart', 'cart.items'], // Подтягиваем связи, чтобы посчитать количество товаров (items count)
    });

    return orders.map((order) => this.mapEntityToModel(order));
  }

  private mapEntityToModel(orderEntity: OrderEntity): any {
    return {
      id: orderEntity.id,
      userId: orderEntity.userId,
      cartId: orderEntity.cartId,
      payment: orderEntity.payment,
      delivery: orderEntity.delivery,
      comments: orderEntity.comments || '',
      status: orderEntity.status,
      total: Number(orderEntity.total),
      address: orderEntity.delivery?.address || orderEntity.delivery || {},
      items: orderEntity.cart?.items
        ? orderEntity.cart.items.map((i) => ({
            productId: i.productId,
            count: i.count,
          }))
        : [],
      statusHistory: [
        {
          status: orderEntity.status,
          timestamp: Date.now(),
          comment: 'Loaded from Database',
        },
      ],
    };
  }

  async findById(orderId: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['cart', 'cart.items'],
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    return this.mapEntityToModel(order);
  }

  async update(orderId: string, data: any): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    const updatedOrder = await this.orderRepository.save({
      ...order,
      ...data,
    });

    return this.mapEntityToModel(updatedOrder);
  }

  async delete(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (order) {
      await this.orderRepository.remove(order);
    }
  }
}
