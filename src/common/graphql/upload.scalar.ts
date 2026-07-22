import { CustomScalar, Scalar } from "@nestjs/graphql";
import {
    GraphQLError,
    Kind,
    ValueNode,
} from 'graphql';

interface GraphqlUploadValue {
    promise: Promise<unknown>;
}


@Scalar('Upload')
export class UploadScalar
    implements CustomScalar<unknown, unknown> {
    description =
        'Scalar Upload đại diện cho một tệp được tải lên';

    parseValue(value: unknown) {
        if (
            typeof value === 'object' &&
            value !== null &&
            'promise' in value
        ) {
            return (
                value as GraphqlUploadValue
            ).promise;
        }

        throw new GraphQLError(
            'Dữ liệu tệp tải lên không hợp lệ',
        );
    }

    serialize() {
        throw new GraphQLError(
            'Không hỗ trợ chuyển đổi dữ liệu tệp tải lên',
        );
    }

    parseLiteral(ast: ValueNode) {
        throw new GraphQLError(
            'Không hỗ trợ truyền tệp tải lên theo dạng literal',
            {
                nodes: ast,
            },
        );
    }
}