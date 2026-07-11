// src/common/graphql/register-enums.ts

import { registerEnumType } from '@nestjs/graphql';
import {
    LoanDetailStatus,
    LoanStatus,
} from '../enums/loan-status.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { UserPermission } from '../enums/user-permission.enum';
import { UserRole } from '../enums/user-role.enum';

registerEnumType(UserRole, {
    name: 'UserRole',
});

registerEnumType(UserPermission, {
    name: 'UserPermission',
});

registerEnumType(LoanStatus, {
    name: 'LoanStatus',
});

registerEnumType(LoanDetailStatus, {
    name: 'LoanDetailStatus',
});

registerEnumType(NotificationType, {
    name: 'NotificationType',
});