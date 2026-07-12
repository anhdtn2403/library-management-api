import { BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";

const bookUploadDirectory = join(
    process.cwd(),
    'uploads',
    'books',
);

export const bookImageUploadOptions = {
    storage: diskStorage({
        destination: (
            req,
            file,
            callback,
        ) => {
            if (!existsSync(bookUploadDirectory)) {
                mkdirSync(bookUploadDirectory, {
                    recursive: true,
                });
            }

            callback(null, bookUploadDirectory);
        },

        filename: (
            req,
            file,
            callback,
        ) => {
            const extension = extname(
                file.originalname,
            ).toLowerCase();

            const filename =
                `${randomUUID()}${extension}`;

            callback(null, filename);
        },
    }),

    limits: {
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (
        req,
        file,
        callback,
    ) => {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
                new BadRequestException(
                    'Only JPG, JPEG, PNG and WEBP images are allowed',
                ),
                false,
            );
        }

        callback(null, true);
    },
};
