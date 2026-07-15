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
        'The Upload scalar represents a file upload';

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
            'Upload value invalid',
        );
    }

    serialize() {
        throw new GraphQLError(
            'Upload serialization unsupported',
        );
    }

    parseLiteral(ast: ValueNode) {
        throw new GraphQLError(
            'Upload literal unsupported',
            {
                nodes: ast,
            },
        );
    }
}