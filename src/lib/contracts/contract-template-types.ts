/** Placeholder keys supported by docs/contracts/standart-sozlesme.docx */
export type ContractTemplateDevice = {
  rowNum: string;
  productName: string;
  serialNumber: string;
};

export type ContractTemplatePlaceholders = {
  contractNumber: string;
  contractDate: string;
  contractStartDate: string;
  contractEndDate: string;
  customerName: string;
  taxNumber: string;
  taxOffice: string;
  address: string;
  phone: string;
  email: string;
  contractAmount: string;
  /** "" when no invoice, " No: FTR-2026-00125" when set */
  invoiceNumber: string;
  /** Loop array for {{#devices}}...{{/devices}} in DOCX template */
  devices: ContractTemplateDevice[];
};

export const CONTRACT_TEMPLATE_STRING_KEYS: (keyof Omit<ContractTemplatePlaceholders, "devices">)[] =
  [
    "contractNumber",
    "contractDate",
    "contractStartDate",
    "contractEndDate",
    "customerName",
    "taxNumber",
    "taxOffice",
    "address",
    "phone",
    "email",
    "contractAmount",
    "invoiceNumber",
  ];
