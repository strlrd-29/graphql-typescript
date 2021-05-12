import { User } from "../entities/User";
import { MyContext } from "../graphql_types/MyContext";
import { UserResponse } from "../graphql_types/UserResponse";
import { UserNamePasswordInput } from "../graphql_types/AuthInput";
import argon2 from "argon2";
import { Resolver, Query, Mutation, Arg, Ctx, Int } from "type-graphql";

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UserNamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { userName: options.userName });
    if (user) {
      return {
        errors: [
          {
            field: "Username",
            message: "username already taken",
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(options.passowrd);
    const newUser = em.create(User, {
      userName: options.userName,
      password: hashedPassword,
    });
    await em.persistAndFlush(newUser);
    req.session!.userId = newUser.id;
    return {
      user: newUser,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UserNamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {
      userName: options.userName,
    });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "That username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.passowrd);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }
    req.session!.userId = user.id;
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async deletUser(@Arg("id", () => Int) id: number, @Ctx() { em }: MyContext) {
    const user = await em.findOne(User, { id });
    if (!user) {
      return false;
    }
    await em.nativeDelete(User, { id });
    return true;
  }

  @Query(() => UserResponse, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    if (!req.session!.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session!.userId });
    return {
      user,
    };
  }

  @Query(() => [User])
  async users(@Ctx() { em }: MyContext): Promise<User[]> {
    const users = await em.find(User, {});
    return users;
  }
}
