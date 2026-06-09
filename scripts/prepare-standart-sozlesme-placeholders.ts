/**
 * Orijinal standart-sozlesme.docx içine yalnızca {{placeholder}} ekler.
 * Paragraf/tablo stillerini korur; imza alanını 2 sütunlu tablo yapar.
 *
 * npx tsx scripts/prepare-standart-sozlesme-placeholders.ts
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";

const TEMPLATE = path.join(
  process.cwd(),
  "docs/contracts/standart-sozlesme.docx"
);
const BACKUP = path.join(
  process.cwd(),
  "docs/contracts/standart-sozlesme.original.docx"
);

/** 2 sütunlu imza tablosu — İDARE | BBS TEKNOLOJİ */
const SIGNATURE_TABLE = `<w:tbl>
  <w:tblPr>
    <w:tblW w:w="5000" w:type="pct"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tblGrid>
    <w:gridCol w:w="4819"/>
    <w:gridCol w:w="4819"/>
  </w:tblGrid>
  <w:tr>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:b/></w:rPr><w:t>İDARE</w:t></w:r>
      </w:p>
    </w:tc>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:b/></w:rPr><w:t>BBS TEKNOLOJİ</w:t></w:r>
      </w:p>
    </w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    </w:tc>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    </w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    </w:tc>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    </w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    </w:tc>
    <w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    </w:tc>
  </w:tr>
</w:tbl>`;

/** w:t düzeyinde birebir metin değişimleri — paragraf yapısı korunur */
const WT_EXACT: Record<string, string> = {
  "Müşteri Adresi.": "{{address}}",
  "ismi ": "{{customerName}}",
  "HGW-Start-15DF": "{{deviceList}}",
};

/** Örnek cihaz seri no metinleri temizlenir */
const WT_CLEAR = new Set(["- Cihaz Seri No ", "1643900421"]);

function replaceWtNodes(xml: string): string {
  return xml.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (full, attrs, text) => {
    if (WT_CLEAR.has(text)) {
      const spaceAttr = /xml:space=/.test(attrs) ? attrs : `${attrs} xml:space="preserve"`;
      return `<w:t${spaceAttr}> </w:t>`;
    }
    const trimmed = text.trim();
    for (const [from, to] of Object.entries(WT_EXACT)) {
      if (text === from || trimmed === from) {
        return `<w:t${attrs}>${to}</w:t>`;
      }
    }
    return full;
  });
}

function replacePatterns(xml: string): string {
  let out = xml;

  // Giriş paragrafı — tek w:t içinde
  out = out.replace(
    /\(Sözleşmede MÜŞTERİ olarak anılacaktır\) arasında aşağıdaki maddeler çerçevesinde bu Bakım, Yönetim ve Güncelleme Sözleşmesi akdedilmiştir\./,
    "(Vergi No: {{taxNumber}}, Vergi Dairesi: {{taxOffice}}, Tel: {{phone}}, E-posta: {{email}}) arasında aşağıdaki maddeler çerçevesinde bu Bakım, Yönetim ve Güncelleme Sözleşmesi akdedilmiştir. Sözleşme No: {{contractNumber}}. Başlangıç: {{contractStartDate}}, Bitiş: {{contractEndDate}}."
  );

  // Madde 6 — bedel (yalnızca nokta karakterleri içeren alan)
  out = out.replace(
    /(<w:t xml:space="preserve">olarak <\/w:t>[\s\S]*?)<w:t[^>]*>[.\u2026…\u00B7]{2,}<\/w:t>/,
    "$1<w:t>{{contractAmount}}</w:t>"
  );

  // Ek 1 — fatura numarası (yalnızca nokta karakterleri içeren alan)
  out = out.replace(
    /(<w:t>Firmanın Kestiği<\/w:t>[\s\S]*?)<w:t[^>]*>[.\u2026…\u00B7]{2,}<\/w:t>/,
    "$1<w:t>{{invoiceNumber}}</w:t>"
  );

  // İmza tarihi — parçalı w:t: 01 + .0 + 2 + .20 + 2 + 6 → 01.02.2026
  out = out.replace(
    /(<w:t[^>]*>İşbu 10 maddelik sözleşme <\/w:t><\/w:r>)(?:<w:r[^>]*>[\s\S]*?<w:t>[^<]*<\/w:t><\/w:r>){6}/,
    '$1<w:r w:rsidR="008535B1"><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Times New Roman"/><w:b/></w:rPr><w:t>{{contractDate}}</w:t></w:r>'
  );

  return out;
}

function replaceSignatureBlock(xml: string): string {
  // Yalnızca imza paragrafını değiştir — paragraf sınırını aşma
  const sigParaRe =
    /<w:p[^>]*>(?:(?!<\/w:p>)[\s\S])*MÜŞTERİ ADINA(?:(?!<\/w:p>)[\s\S])*BBS TEKNOLOJI ADINA(?:(?!<\/w:p>)[\s\S])*<\/w:p>/;
  return xml.replace(sigParaRe, SIGNATURE_TABLE);
}

export function injectPlaceholders(xml: string): string {
  let out = xml;
  out = replaceWtNodes(out);
  out = replacePatterns(out);
  out = replaceSignatureBlock(out);
  return out;
}

export function replaceWtNodesOnly(xml: string): string {
  return replaceWtNodes(xml);
}

export function replacePatternsOnly(xml: string): string {
  return replacePatterns(xml);
}

export function replaceSignatureBlockOnly(xml: string): string {
  return replaceSignatureBlock(xml);
}

function main() {
  const source = fs.existsSync(BACKUP) ? BACKUP : TEMPLATE;
  if (!fs.existsSync(source)) {
    console.error(`Şablon bulunamadı: ${source}`);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP) && source === TEMPLATE) {
    fs.copyFileSync(TEMPLATE, BACKUP);
    console.log(`Yedek: ${BACKUP}`);
  }

  const content = fs.readFileSync(source, "binary");
  const zip = new PizZip(content);
  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    console.error("word/document.xml bulunamadı");
    process.exit(1);
  }

  const originalXml = docFile.asText();
  const updatedXml = injectPlaceholders(originalXml);

  zip.file("word/document.xml", updatedXml);
  fs.writeFileSync(
    TEMPLATE,
    zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
  );

  const placeholders = [...new Set(updatedXml.match(/\{\{[^}]+\}\}/g) ?? [])];
  const hasTable =
    updatedXml.includes("<w:tbl>") && updatedXml.includes("İDARE");
  const xmlLen = updatedXml.length;
  console.log(`Güncellendi: ${TEMPLATE}`);
  console.log(`XML uzunluk: ${xmlLen} (orijinal: ${originalXml.length})`);
  console.log(`Placeholder: ${placeholders.length}`, placeholders.sort());
  console.log(`İmza tablosu: ${hasTable ? "evet" : "hayır"}`);

  if (xmlLen < originalXml.length * 0.5) {
    console.error("UYARI: XML boyutu anormal küçüldü — regex kontrol edin.");
    process.exit(1);
  }
}

if (process.argv[1]?.includes("prepare-standart-sozlesme-placeholders")) {
  main();
}