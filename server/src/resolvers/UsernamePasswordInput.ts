import { Field, InputType } from "type-graphql";
// Creates fields for username and password for registration and login
@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  email: string;
  @Field()
  password: string;
}
