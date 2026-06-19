import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CartEntity } from '../../cart/entities/cart.entity';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Column({ name: 'cart_id', type: 'uuid', nullable: false })
  cartId!: string;

  @Column({ type: 'jsonb', nullable: false })
  payment!: any;

  @Column({ type: 'jsonb', nullable: false })
  delivery!: any;

  @Column({ type: 'text', nullable: true })
  comments!: string;

  @Column({ type: 'varchar', nullable: false, default: 'IN_PROGRESS' })
  status!: string;

  @Column({ type: 'numeric', nullable: false })
  total!: number;

  @ManyToOne(() => CartEntity)
  @JoinColumn({ name: 'cart_id' })
  cart!: CartEntity;
}
