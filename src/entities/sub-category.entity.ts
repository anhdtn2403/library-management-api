
import { Category } from './category.entity';
import { Book } from './book.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sub_categories')
export class SubCategory {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    category_id!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @ManyToOne(() => Category, category => category.sub_categories)
    @JoinColumn({ name: 'category_id' })
    category!: Category;

    @OneToMany(() => Book, book => book.sub_category)
    books!: Book[];
}