import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { AuthsService } from "./auths.service";
import { AuthTokenType, RegisteredUserType } from "./graphql/auth.type";
import { LoginInput } from "./graphql/login.input";
import { RegisterInput } from "./graphql/register.input";
import { RefreshInput } from "./graphql/refresh.input";

@Resolver()
export class AuthsResolver {
    constructor(private readonly authsService: AuthsService) { }

    @Mutation(() => RegisteredUserType)
    register(
        @Args('input')
        input: RegisterInput,
    ) {
        return this.authsService.register(input);
    }

    @Mutation(() => AuthTokenType)
    login(
        @Args('input')
        input: LoginInput,
    ) {
        return this.authsService.login(input);
    }

    @Mutation(() => AuthTokenType)
    refreshToken(
        @Args('input')
        input: RefreshInput,
    ) {
        return this.authsService.refresh(input.refresh_token);
    }
}