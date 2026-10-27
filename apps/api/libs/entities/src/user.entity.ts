import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({unique: true})
    email!: string

    @Column({select: false})
    passwordHash!: string

    @Column()
    firstName!: string

    @Column()
    lastName!: string

    @Column({ type: 'text', array: true, default: () => "ARRAY['user']" })
    roles!: string[];

    @Column()
    isActive!: boolean

    @CreateDateColumn()
    createdAt!: Date
    
}