import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  status!: 'TODO' | 'DONE' | 'IN_PROGRESS';

  @Column()
  assigneeId!: number;
}