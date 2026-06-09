import { z } from "zod";

export const fileCenterListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  customerId: z.string().uuid().optional(),
  fileType: z.enum(["PDF", "ATTACHMENT"]).optional(),
  module: z
    .enum([
      "QUOTE",
      "CONTRACT",
      "CUSTOMER",
      "SERVICE_TICKET",
      "VISIT",
    ])
    .optional(),
  uploadedById: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type FileCenterListQuery = z.infer<typeof fileCenterListQuerySchema>;

export const fileSourceSchema = z.enum([
  "document",
  "quote-pdf",
  "contract-pdf",
]);

export type FileSourceParam = z.infer<typeof fileSourceSchema>;
