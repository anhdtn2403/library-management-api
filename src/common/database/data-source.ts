import 'dotenv/config';
import { Book } from '../../entities/book.entity';
import { LoanDetail } from '../../entities/loan-detail.entity';
import { Loan } from '../../entities/loan.entity';
import { User } from '../../entities/user.entity';
import { DataSource } from "typeorm";
import { RolePermission } from '../../entities/role-permission.entity';
import { LmsNotification } from '../../entities/lms-notification.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    entities: [Book, User, Loan, LoanDetail, RolePermission, LmsNotification],

    migrations: ['src/migrations/*.ts'],
    synchronize: false,
})