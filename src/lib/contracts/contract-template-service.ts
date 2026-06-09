import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ContractTemplatePlaceholders } from "./contract-template-types";

export const CONTRACT_TEMPLATE_RELATIVE_PATH =
  "docs/contracts/standart-sozlesme.docx";

export function getContractTemplatePath(): string {
  return path.join(process.cwd(), CONTRACT_TEMPLATE_RELATIVE_PATH);
}

export function assertContractTemplateExists(): void {
  const templatePath = getContractTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Sözleşme şablonu bulunamadı: ${CONTRACT_TEMPLATE_RELATIVE_PATH}`
    );
  }
}

export function mergeContractTemplate(
  placeholders: ContractTemplatePlaceholders
): Buffer {
  assertContractTemplateExists();
  const content = fs.readFileSync(getContractTemplatePath(), "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  doc.render(placeholders);

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}
