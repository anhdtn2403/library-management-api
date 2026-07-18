import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DashboardSummaryType {
    @Field(() => Int)
    total_book_titles!: number; // số đầu sách

    @Field(() => Int)
    total_book_copies!: number; // Tổng số bản sách vật lý đang có trong hệ thống

    @Field(() => Int)
    borrowed_book_copies!: number; // Tổng số bản sách đang được người dùng mượn

    @Field(() => Int)
    available_book_copies!: number; // Tổng số bản sách còn có thể cho mượn

    @Field(() => Int)
    total_members!: number; // Số thành viên hoạt động: role = MEMBER vs is_active = true

    @Field(() => Int)
    pending_loans!: number;

    @Field(() => Int)
    pending_payment_loans!: number;

    @Field(() => Int)
    borrowing_loans!: number;

    @Field(() => Int)
    completed_loans!: number;

    @Field(() => Int)
    cancelled_loans!: number;

    @Field(() => Int)
    overdue_details!: number; // Số sách mượn quá hạn 

    @Field(() => Float)
    rental_revenue!: number; // Tổng phí thuê sách

    @Field(() => Float)
    fine_revenue!: number; // Tổng tiền phạt trễ hạn

    @Field(() => Float)
    lost_book_revenue!: number; // Tổng phí bồi thường sách bị mất

    @Field(() => Float)
    total_revenue!: number; // = rental_revenue + + fine_revenue + lost_book_revenue

    @Field(() => Float)
    holding_deposit!: number; // Khoản tiền cọc mà hệ thống được xem là vẫn đang giữ = deposit_amount - deposit_refund_amount
}