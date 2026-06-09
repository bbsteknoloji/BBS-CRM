/**
 * @deprecated Orijinal standart-sozlesme.docx kullanın. Bu script basitleştirilmiş şablon üretir.
 * Generates docs/contracts/standart-sozlesme.docx with {{placeholder}} tokens.
 * Run: npx tsx scripts/generate-standart-sozlesme-template.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

const OUTPUT = path.join(
  process.cwd(),
  "docs/contracts/standart-sozlesme.docx"
);

function p(text: string, bold = false): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, bold, size: 22 })],
    spacing: { after: 120 },
  });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 200, after: 120 },
  });
}

async function main() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "HOT SPOT GATEWAY CİHAZI BAKIMI VE DESTEK HİZMET ALIMLARI TİP SÖZLEŞMESİ",
                bold: true,
                size: 26,
              }),
            ],
            spacing: { after: 240 },
          }),
          heading("Madde 1 — Sözleşmenin Tarafları"),
          p(
            'Bu sözleşme, bir tarafta {{customerName}} (bundan sonra "İdare" olarak anılacaktır) ile diğer tarafta BBS TEKNOLOJİ (bundan sonra "Yüklenici" olarak anılacaktır) arasında aşağıdaki şartlar dâhilinde akdedilmiştir. Sözleşme No: {{contractNumber}}'
          ),
          heading("Madde 2 — Taraflara İlişkin Bilgiler"),
          p("2.1. İdarenin Tebligat Adresi: {{address}}"),
          p("Vergi No: {{taxNumber}}"),
          p("Vergi Dairesi: {{taxOffice}}"),
          p("Telefon: {{phone}}"),
          p("E-posta: {{email}}"),
          p(
            "2.2. Yüklenicinin Tebligat Adresi: Üniversite Mah. İpekyolu Cad. Ata Teknokent No:22 İç kapı No:212 Yakutiye / ERZURUM — Tel: (0442) 233 86 00"
          ),
          heading("Madde 5 — İş Tanımı"),
          p(
            "Sözleşme konusu iş; {{contractStartDate}} — {{contractEndDate}} tarihleri arasında 5651 sayılı Kanun kapsamında aşağıdaki cihazların bakım, onarım, uzaktan güncelleme ve destek hizmetidir:"
          ),
          p("{{deviceList}}"),
          heading("Madde 6 — Sözleşmenin Türü ve Bedeli"),
          p(
            "6.1. İdare tarafından {{contractAmount}} ödenecektir. Sözleşme tarihi: {{contractDate}}."
          ),
          p(
            "6.2. Yüklenici tarafından verilecek hizmet karşılığında ödenecek ücret sözleşme bitim tarihine kadar sabit kalacaktır."
          ),
          heading("Madde 10 — Sözleşmenin Süresi"),
          p(
            "Sözleşmenin süresi {{contractStartDate}} — {{contractEndDate}} tarihleri arasındadır."
          ),
          heading("Madde 38 — Yetkili Mahkeme"),
          p(
            "Bu sözleşmeden doğacak uyuşmazlıklarda İdarenin bulunduğu yer mahkemeleri yetkilidir."
          ),
          heading("Madde 40 — İmza"),
          p("İşbu sözleşme {{contractDate}} tarihinde iki nüsha olarak imzalanmıştır."),
          p("İDARE: {{customerName}}"),
          p("YÜKLENİCİ: BBS TEKNOLOJİ"),
        ],
      },
    ],
  });

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Şablon oluşturuldu: ${OUTPUT} (${buffer.length} byte)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
