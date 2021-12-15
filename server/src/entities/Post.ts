import { ObjectType, Field } from "type-graphql";
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Entity, Column, BaseEntity, ManyToOne, OneToMany } from "typeorm";
import { Upvote } from "./Upvote";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  authorId!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field() 
  @Column()
  title!: string;

  @Field() 
  @Column()
  text!: string;

  @Field() 
  @Column({ type: 'int', default: 0 })
  points!: number;

  @Field()
  @ManyToOne(() => User, user => user.posts)
  author: User;

  @OneToMany(() => Upvote, (upvote) => upvote.post)
  upvotes: Upvote[];
}