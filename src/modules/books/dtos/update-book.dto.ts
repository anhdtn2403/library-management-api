import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) { 
    
}
// Nghĩa là UpdateBookDto kế thừa toàn bộ field và validation từ CreateBookDto,
// nhưng tất cả field đều thành optional.
// cài "npm install @nestjs/mapped-types" để dùng