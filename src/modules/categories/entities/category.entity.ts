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

  // Generate uniqueId before insert
  @BeforeInsert()
  generateUniqueId() {
    if (!this.uniqueId) {
      this.uniqueId = uuidv4();
    }
  }

  // Relation to products (will be added later)
  // @OneToMany(() => Product, (product) => product.category)
  // products: Product[];
}
