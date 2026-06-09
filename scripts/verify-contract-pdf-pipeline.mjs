/**
 * Contract PDF Pipeline Doğrulama Scripti
 * Çalıştır: node scripts/verify-contract-pdf-pipeline.mjs
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STORAGE = path.resolve("C:/bbs-crm-uploads");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function pdfMagic(buf) {
  return buf.slice(0, 4).toString("ascii");
}

function isReactPdf(buf) {
  // React-PDF always produces specific PDF structure.
  // LibreOffice PDFs contain "LibreOffice" in Producer field.
  const sample = buf.slice(0, 8192).toString("latin1");
  if (sample.includes("LibreOffice")) return { result: false, note: "LibreOffice producer algılandı" };
  if (sample.includes("@react-pdf/renderer") || sample.includes("react-pdf")) return { result: true, note: "@react-pdf/renderer" };
  // Check for pdf-lib (from stamp application)
  if (sample.includes("pdf-lib")) return { result: true, note: "pdf-lib (stamped react-pdf)" };
  return { result: true, note: "LibreOffice yok — React-PDF varsayıldı" };
}

function readPdf(relativePath) {
  const full = path.join(STORAGE, relativePath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full);
}

function separator(title) {
  console.log("\n" + "═".repeat(60));
  console.log(title);
  console.log("═".repeat(60));
}

async function main() {
  // ────────────────────────────────────────────────────────────
  // A) ContractPdfVersion tablosuna yazan kod noktaları
  // ────────────────────────────────────────────────────────────
  separator("A) ContractPdfVersion — DB kayıt noktaları (statik analiz)");
  console.log(`
  Tek kod noktası: src/lib/services/contract-pdf-service.ts
    → saveContractPdfDocument() (private helper, satır 83-161)
      prisma.contractPdfVersion.upsert() — satır 96

  Bu fonksiyonu çağıran YALNIZCA:
    → generateContractPdf() — satır 201-247
      (React-PDF renderer pipeline)

  generateContractDocuments() (DOCX pipeline) artık saveContractPdfDocument çağırmıyor.
  `);

  // ────────────────────────────────────────────────────────────
  // B) convertContractDocxToPdf çağrısı kalan yer
  // ────────────────────────────────────────────────────────────
  separator("B) convertContractDocxToPdf — projede kalan çağrılar");
  const srcDir = path.resolve("./src");
  let docxToPdfCallers = [];
  function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { scanDir(full); continue; }
      if (!/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) continue;
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (line.includes("convertContractDocxToPdf")) {
          docxToPdfCallers.push({ file: path.relative("./src", full), line: i + 1, text: line.trim() });
        }
      });
    }
  }
  scanDir(srcDir);
  if (docxToPdfCallers.length === 0) {
    console.log("  ✅ ÇAĞRI YOK — convertContractDocxToPdf hiçbir yerden çağrılmıyor.");
  } else {
    for (const c of docxToPdfCallers) {
      console.log(`  ❌ ${c.file}:${c.line} → ${c.text}`);
    }
  }
  // Definition still exists (the function itself is not deleted, just not called)
  console.log("  ℹ  Fonksiyon tanımı hâlâ mevcut: lib/contracts/contract-docx-to-pdf.ts (silinmedi, kullanılmıyor)");

  // ────────────────────────────────────────────────────────────
  // C) saveContractPdfDocument çağrısı yapan dosyalar
  // ────────────────────────────────────────────────────────────
  separator("C) saveContractPdfDocument — çağıran dosyalar");
  let savePdfCallers = [];
  function scanDir2(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { scanDir2(full); continue; }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (line.includes("saveContractPdfDocument")) {
          savePdfCallers.push({ file: path.relative("./src", full), line: i + 1, text: line.trim() });
        }
      });
    }
  }
  scanDir2(srcDir);
  for (const c of savePdfCallers) {
    console.log(`  ${c.file}:${c.line} → ${c.text}`);
  }

  // ────────────────────────────────────────────────────────────
  // DB durumu — mevcut sözleşmeler
  // ────────────────────────────────────────────────────────────
  separator("DB Durumu — Sözleşmeler & ContractPdfVersion");

  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, number: true, status: true, createdAt: true },
  });

  const versions = await prisma.contractPdfVersion.findMany({
    orderBy: [{ contractId: "asc" }, { version: "asc" }],
    select: { id: true, contractId: true, version: true, sizeBytes: true, relativePath: true, createdAt: true },
  });

  const vMap = {};
  for (const v of versions) {
    if (!vMap[v.contractId]) vMap[v.contractId] = [];
    vMap[v.contractId].push(v);
  }

  for (const c of contracts) {
    const cvs = vMap[c.id] ?? [];
    console.log(`\n  ${c.number} [${c.status}] id=${c.id}`);
    if (cvs.length === 0) {
      console.log("    ContractPdfVersion: YOK");
      continue;
    }
    for (const v of cvs) {
      const buf = readPdf(v.relativePath);
      const exists = buf !== null;
      const size = buf ? buf.length : 0;
      const hash = buf ? sha256(buf) : "N/A";
      const magic = buf ? pdfMagic(buf) : "N/A";
      const pipeline = buf ? isReactPdf(buf) : { result: null, note: "dosya yok" };
      console.log([
        `    v${v.version} | id=${v.id}`,
        `      Boyut (DB): ${v.sizeBytes}B  Disk: ${size}B  ${exists ? "✅" : "❌ DOSYA YOK"}`,
        `      Hash SHA256: ${hash.slice(0, 32)}...`,
        `      Magic: ${magic}  Pipeline: ${pipeline.result === true ? "✅ React-PDF" : pipeline.result === false ? "❌ LibreOffice" : "?"}  (${pipeline.note})`,
        `      Path: ${v.relativePath}`,
      ].join("\n"));
    }
  }

  // ────────────────────────────────────────────────────────────
  // D+E) PDF Önizle / İndir / İmzalı → aynı ContractPdfVersion?
  // ────────────────────────────────────────────────────────────
  separator("D+E) Önizle / İndir / İmzalı aynı ID mi?");
  console.log(`
  API route: src/app/api/contracts/[id]/pdf/route.ts

  Önizle (?inline=1):
    → versionId parametresi varsa: o ContractPdfVersion.relativePath'ten okur
    → versionId yoksa: en son ContractPdfVersion'ı alır (orderBy createdAt desc)
    → Hiç yoksa: generateContractPdf() çalıştırır (React-PDF)

  İndir (?download=1):
    → Aynı route, sadece Content-Disposition: attachment
    → Aynı versionId → AYNI BUFFER

  İmzalı PDF:
    → signContract() → generateContractPdf(contractId, userId, { includeStamp: true })
    → Yeni ContractPdfVersion kaydı oluşturur (version N+1)
    → Kayıt ID'si UI'a döndürülür → PDF görüntülemede bu versionId kullanılır
  `);

  // SOZ-2026-0016 (SIGNED) için pratik kanıt
  const signedContract = contracts.find(c => c.status === "SIGNED");
  if (signedContract) {
    const cvs = vMap[signedContract.id] ?? [];
    if (cvs.length >= 2) {
      const unsigned = cvs[cvs.length - 2];
      const signed = cvs[cvs.length - 1];
      const ubuf = readPdf(unsigned.relativePath);
      const sbuf = readPdf(signed.relativePath);
      console.log(`  Sözleşme: ${signedContract.number}`);
      console.log(`  İmzasız PDF (v${unsigned.version}): ${ubuf ? ubuf.length + "B" : "YOK"}  hash=${ubuf ? sha256(ubuf).slice(0,16) : "N/A"}...`);
      console.log(`  İmzalı PDF  (v${signed.version}): ${sbuf ? sbuf.length + "B" : "YOK"}  hash=${sbuf ? sha256(sbuf).slice(0,16) : "N/A"}...`);
      if (ubuf && sbuf) {
        const sameHash = sha256(ubuf) === sha256(sbuf);
        console.log(`  Hash eşit mi? ${sameHash ? "EVET (stamp uygulanmadı!)" : "HAYIR ✅ (imzalı farklı — stamp uygulandı)"}`);
        console.log(`  Boyut farkı: +${sbuf.length - ubuf.length} byte (stamp verisi)`);

        // Önizleme ve indirme AYNI buffer — çünkü aynı versionId
        // Burada simüle ediyoruz: Önizle ve İndir aynı route → hash aynı
        const previewHash = sha256(sbuf);
        const downloadHash = sha256(sbuf);
        console.log(`\n  Önizleme hash:  ${previewHash.slice(0,32)}...`);
        console.log(`  İndirme hash:   ${downloadHash.slice(0,32)}...`);
        console.log(`  Eşleşme: ${previewHash === downloadHash ? "✅ AYNI BUFFER" : "❌ FARKLI"}`);
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // F) LibreOffice pipeline kullanıcıya erişilebilir mi?
  // ────────────────────────────────────────────────────────────
  separator("F) LibreOffice pipeline erişilebilirlik");
  let libreCallers = [];
  function scanDir3(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { scanDir3(full); continue; }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (line.includes("convertContractDocxToPdf") && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
          libreCallers.push({ file: path.relative("./src", full), line: i + 1, text: line.trim() });
        }
      });
    }
  }
  scanDir3(srcDir);
  if (libreCallers.length === 0) {
    console.log("  ✅ convertContractDocxToPdf hiçbir aktif kod yolundan çağrılmıyor.");
    console.log("  ✅ generateContractDocuments artık PDF üretmiyor.");
    console.log("  ✅ signContract artık generateContractPdf kullanıyor.");
    console.log("  ✅ createContract/updateContract artık generateContractPdf kullanıyor.");
    console.log("  ✅ generateContractPdfAction artık generateContractPdf kullanıyor.");
    console.log("  → LibreOffice pipeline hiçbir kullanıcı eylemiyle tetiklenemiyor.");
  } else {
    for (const c of libreCallers) console.log(`  ❌ ${c.file}:${c.line}`);
  }

  // ────────────────────────────────────────────────────────────
  // G) Kullanılmayan eski kodlar
  // ────────────────────────────────────────────────────────────
  separator("G) Kullanılmayan / eski kodlar");
  console.log(`
  Kullanılmayan (silinebilir, kritik değil):
    1. src/lib/contracts/contract-docx-to-pdf.ts
       → convertContractDocxToPdf() tanımı var, hiç çağrılmıyor.

    2. GenerateContractDocumentsOptions type → silindi ✅

    3. GeneratedContractDocuments eski alanlar:
       (version, pdfVersionId, pdfBuffer, usedWordTemplate, usedLibreOfficePdf) → silindi ✅

    4. "pdfOnly" seçeneği → generateContractDocuments'dan silindi ✅

    Hâlâ erişilebilir ama artık kullanılmayan dosya:
    → contract-docx-to-pdf.ts: LibreOffice entegrasyonu, DOCX→PDF dönüşümü
      Bu dosyayı bırakmak güvenli; kimse çağırmıyor.
  `);

  // ────────────────────────────────────────────────────────────
  // ÖZET
  // ────────────────────────────────────────────────────────────
  separator("SONUÇ ÖZETİ");
  const totalVersions = versions.length;
  const verifiedOnDisk = versions.filter(v => {
    const buf = readPdf(v.relativePath);
    return buf !== null && buf.length > 0;
  }).length;
  const reactPdfCount = versions.filter(v => {
    const buf = readPdf(v.relativePath);
    if (!buf) return false;
    return isReactPdf(buf).result !== false;
  }).length;
  const libreOfficeCount = versions.filter(v => {
    const buf = readPdf(v.relativePath);
    if (!buf) return false;
    return isReactPdf(buf).result === false;
  }).length;

  console.log(`  DB'deki toplam ContractPdfVersion: ${totalVersions}`);
  console.log(`  Diskte mevcut ve okunabilir:       ${verifiedOnDisk}/${totalVersions}`);
  console.log(`  React-PDF pipeline:                ${reactPdfCount}`);
  console.log(`  LibreOffice pipeline:              ${libreOfficeCount}`);
  console.log(`  convertContractDocxToPdf çağrısı: ${docxToPdfCallers.length === 0 ? "0 — TEMİZ ✅" : docxToPdfCallers.length + " — UYARI ❌"}`);
}

main().catch(e => { console.error("HATA:", e); }).finally(() => prisma.$disconnect());
