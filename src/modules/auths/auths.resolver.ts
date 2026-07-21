import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { AuthsService } from "./auths.service";
import { AuthTokenType, RegisteredUserType } from "./graphql/auth.type";
import { LoginInput } from "./graphql/login.input";
import { RegisterInput } from "./graphql/register.input";
import { RefreshInput } from "./graphql/refresh.input";
import { MessageType } from "./graphql/message.type";
import { VerifyEmailInput } from "./graphql/verify-email.input";
import { ResendVerificationInput } from "./graphql/resend-verification.input";
import { ForgotPasswordInput } from "./graphql/forgot-password.input";
import { ResetPasswordInput } from "./graphql/reset-password.input";

@Resolver()
export class AuthsResolver {
    constructor(private readonly authsService: AuthsService) { }

    @Mutation(() => RegisteredUserType)
    register(
        @Args('input') input: RegisterInput
    ) {
        return this.authsService.register(input);
    }

    @Mutation(() => MessageType)
    verifyEmail(
        @Args('input') input: VerifyEmailInput
    ) {
        return this.authsService.verifyEmail(input.token);
    }

    @Mutation(() => MessageType)
    resendVerificationEmail(
        @Args('input') input: ResendVerificationInput
    ) {
        return this.authsService.resendVerificationEmail(input.email);
    }

    @Mutation(() => AuthTokenType)
    login(
        @Args('input') input: LoginInput
    ) {
        return this.authsService.login(input);
    }

    @Mutation(() => AuthTokenType)
    refreshToken(
        @Args('input') input: RefreshInput
    ) {
        return this.authsService.refresh(input.refresh_token);
    }

    @Mutation(() => MessageType)
    forgotPassword(
        @Args('input') input: ForgotPasswordInput
    ) {
        return this.authsService.forgotPassword(input.email);
    }

    @Mutation(() => MessageType)
    resetPassword(
        @Args('input') input: ResetPasswordInput
    ) {
        return this.authsService.resetPassword(
            input.token,
            input.new_password,
            input.confirm_password,
        );
    }
}