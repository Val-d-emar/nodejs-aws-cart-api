import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CartItemEntity } from './cart-item.entity';

export type CartStatus = 'OPEN' | 'ORDERED';

@Entity({ name: 'carts' })
export class CartEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'date' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'date' })
  updatedAt!: Date;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'ORDERED'],
    default: 'OPEN',
  })
  status!: CartStatus;

  @OneToMany(() => CartItemEntity, (item) => item.cart, { cascade: true })
  items!: CartItemEntity[];
}
