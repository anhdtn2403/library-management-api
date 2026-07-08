export enum LoanStatus {
    PENDING = 'PENDING', // Member vừa tạo phiếu, chờ duyệt => trong lúc này, member có thể hủy
    PENDING_PAYMENT = 'PENDING_PAYMENT', // Thủ thư/BE đã xác nhận thông tin, tính loan_date, due_date; chờ khách thanh toán tại quầy => trong lúc này, member có thể hủy
    BORROWING = 'BORROWING', // Khách đã thanh toán phí mượn, sách đã được giao.
    COMPLETED = 'COMPLETED', // Tất cả sách trong phiếu đã được trả hoặc xử lý mất.
    CANCELLED = 'CANCELLED', // Yêu cầu mượn bị hủy.
}

export enum LoanDetailStatus {
    PENDING = 'PENDING', // Member vừa tạo phiếu, backend mới lưu yêu cầu mượn.
    BORROWING = 'BORROWING', // Khách đã thanh toán phí mượn, sách đã được giao.
    RETURNED = 'RETURNED', // sách đã trả
    OVERDUE = 'OVERDUE', // sách quá hạn, chưa trả
    LOST = 'LOST', // sách bị mất
    CANCELLED = 'CANCELLED', // Yêu cầu mượn bị hủy.
}