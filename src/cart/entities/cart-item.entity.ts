import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CartEntity } from './cart.entity';

@Entity({ name: 'cart_items' })
export class CartItemEntity {
  @PrimaryColumn({ name: 'cart_id', type: 'uuid' })
  cartId!: string;

  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ type: 'integer', nullable: false })
  count!: number;

  @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: CartEntity;
}
