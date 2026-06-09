import fs from "node:fs";
import path from "node:path";
import { mergeContractTemplate } from "../src/lib/contracts/contract-template-service";
import { convertContractDocxToPdf } from "../src/lib/contracts/contract-docx-to-pdf";
import { formatDeviceList } from "../src/lib/contracts/contract-placeholder-service";

async function main() {
  const outDir = "C:/temp/lo-conv-test";
  fs.mkdirSync(outDir, { recursive: true });

  const docx = mergeContractTemplate({
    contractNumber: "SOZ-TEST-001",
    contractDate: "06.06.2026",
    contractStartDate: "01.06.2026",
    contractEndDate: "31.05.2027",
    customerName: "Test İdare A.Ş.",
    taxNumber: "1234567890",
    taxOffice: "Test VD",
    address: "Test Mah. Erzurum",
    phone: "0442 000 00 00",
    email: "test@ornek.com",
    contractAmount: "12.000,00 TL (KDV Hariç)",
    deviceList: formatDeviceList([
      {
        deviceName: "HGW Start 15DF",
        brand: "Tinax",
        model: "15-DF",
        serialNumber: "20123658256",
      },
    ]),
    invoiceNumber: "INV-2026-00125",
  });

  const docxPath = path.join(outDir, "pdf-test.docx");
  const pdfPath = path.join(outDir, "pdf-test.pdf");
  fs.writeFileSync(docxPath, docx);

  console.log("DOCX:", docxPath, docx.length, "byte");
  const pdf = await convertContractDocxToPdf(docx);
  fs.writeFileSync(pdfPath, pdf);
  console.log("PDF:", pdfPath, pdf.length, "byte");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
