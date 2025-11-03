import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  uniqueId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relation to products
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  // Generate uniqueId before insert
  @BeforeInsert()
  generateUniqueId() {
    if (!this.uniqueId) {
      this.uniqueId = uuidv4();
    }
  }
}
