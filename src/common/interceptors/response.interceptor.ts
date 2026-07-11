import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        // GraphQL phải trả đúng dữ liệu theo schema,
        // không bọc bằng format response của REST.
        if (context.getType<string>() === 'graphql') {
            return next.handle();
        }

        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map((data) => ({
                success: true,
                statusCode: response.statusCode,
                message: this.getDefaultMessage(response.statusCode),
                data: data || null,
            })),
        );
    }
    private getDefaultMessage(statusCode: number): string {
        switch (statusCode) {
            case 200:
                return 'Success';
            case 201:
                return 'Created successfully';
            default:
                return 'Success';
        }
    }
}