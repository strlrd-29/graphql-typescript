import { InputType, Field } from "type-graphql";

@InputType()
export class UserNamePasswordInput {
  @Field()
  userName: string;

  @Field()
  passowrd: string;
}
