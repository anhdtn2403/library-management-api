import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { UserRole } from "../enums/user-role.enum";

export interface CurrentUserData {
    userId: number;
    email: string;
    role: UserRole;
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