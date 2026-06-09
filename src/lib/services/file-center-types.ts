export type FileCenterSource = "document" | "quote_pdf" | "contract_pdf";

export type FileCenterModule =
  | "QUOTE"
  | "CONTRACT"
  | "CUSTOMER"
  | "SERVICE_TICKET"
  | "VISIT";

export type FileCenterItem = {
  id: string;
  source: FileCenterSource;
  sourceId: string;
  fileName: string;
  module: FileCenterModule;
  fileType: "PDF" | "ATTACHMENT";
  customerId: string;
  customerName: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  entityId: string;
  detailPath: string;
  viewUrl: string;
  downloadUrl: string;
  canDelete: boolean;
};

export type FileCenterCursor = {
  createdAt: string;
  id: string;
  source: FileCenterSource;
};
