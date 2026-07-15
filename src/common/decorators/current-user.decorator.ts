import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export interface CurrentUserData {
    userId: number;
    email: string;
    role: string;
}

export const CurrentUser = createParamDecorator(
    (
        _data: unknown,
        context: ExecutionContext,
    ): CurrentUserData => {
        const gqlContext =
            GqlExecutionContext.create(context);

        const request =
            gqlContext.getContext().req;

        return request.user;
    },
);