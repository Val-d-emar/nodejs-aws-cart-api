import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatuses } from '../models';
import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';
import { PutCartPayload } from '../../order/type';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
  ) {}

  private mapEntityToModel(cartEntity: CartEntity): Cart {
    return {
      id: cartEntity.id,
      user_id: cartEntity.userId,
      created_at: new Date(cartEntity.createdAt).getTime(),
      updated_at: new Date(cartEntity.updatedAt).getTime(),
      status: CartStatuses.OPEN,
      items: cartEntity.items
        ? cartEntity.items.map((item) => ({
            product: {
              id: item.productId,
              title: 'Database Product',
              description: 'Loaded from PostgreSQL',
              price: 100,
            },
            count: item.count,
          }))
        : [],
    };
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const cartEntity = await this.cartRepository.findOne({
      where: { userId, status: 'OPEN' },
      relations: ['items'],
    });

    if (!cartEntity) {
      return null;
    }

    return this.mapEntityToModel(cartEntity);
  }

  async createByUserId(userId: string): Promise<Cart> {
    const cartEntity = this.cartRepository.create({
      userId,
      status: 'OPEN',
    });

    const savedCart = await this.cartRepository.save(cartEntity);
    return this.mapEntityToModel(savedCart);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    const cart = await this.findOrCreateByUserId(userId);

    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId: payload.product.id },
    });

    if (payload.count === 0) {
      if (existingItem) {
        await this.cartItemRepository.remove(existingItem);
      }
    } else {
      if (existingItem) {
        existingItem.count = payload.count;
        await this.cartItemRepository.save(existingItem);
      } else {
        const newItem = this.cartItemRepository.create({
          cartId: cart.id,
          productId: payload.product.id,
          count: payload.count,
        });
        await this.cartItemRepository.save(newItem);
      }
    }

    const updatedCart = await this.findByUserId(userId);
    if (!updatedCart) {
      throw new Error(`Cart for user ${userId} was not found after update.`);
    }

    return updatedCart;
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { userId, status: 'OPEN' },
    });

    if (cart) {
      await this.cartRepository.remove(cart);
    }
  }
}
