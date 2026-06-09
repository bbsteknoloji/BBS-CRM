/**
 * YENİ pipeline doğrulama — generateContractPdf() doğrudan test
 * Çalıştır: npx tsx scripts/test-new-pipeline.ts
 */
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STORAGE = path.resolve("C:/bbs-crm-uploads");

function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function detectPipeline(buf: Buffer): string {
  const text = buf.toString("latin1");
  if (text.includes("LibreOffice")) return "❌ LibreOffice";
  if (text.includes("@react-pdf") || text.includes("react-pdf")) return "✅ React-PDF (@react-pdf/renderer)";
  if (text.includes("pdf-lib")) return "✅ pdf-lib (stamped React-PDF)";
  return "✅ Bilinmiyor (LibreOffice yok — React-PDF varsayıldı)";
}

async function main() {
  // Mevcut DRAFT sözleşmeyi kullan: SOZ-2026-0017
  const CONTRACT_ID = "721d01d7-36e2-4b01-b94c-e435bd564677";
  const TEST_USER_ID = "00000000-0000-0000-0000-000000000001"; // mock, activity log için

  // Gerçek userId al
  const admin = await prisma.user.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true, email: true },
  });
  const userId = admin?.id ?? TEST_USER_ID;
  console.log(`Test kullanıcısı: ${admin?.email ?? "mock"} (${userId})`);

  const contract = await prisma.contract.findFirst({
    where: { id: CONTRACT_ID },
    select: { number: true, status: true },
  });
  console.log(`\nTest sözleşmesi: ${contract?.number} [${contract?.status}]`);

  // Önceki ContractPdfVersion sayısı
  const beforeCount = await prisma.contractPdfVersion.count({ where: { contractId: CONTRACT_ID } });
  const beforeLatest = await prisma.contractPdfVersion.findFirst({
    where: { contractId: CONTRACT_ID },
    orderBy: { version: "desc" },
    select: { id: true, version: true, sizeBytes: true, relativePath: true },
  });
  console.log(`\nÖnceki durum: ${beforeCount} ContractPdfVersion, en son v${beforeLatest?.version ?? 0}`);

  // ── TEST 1: generateContractPdf (imzasız)
  console.log("\n── TEST 1: generateContractPdf() (imzasız) ──");
  const { generateContractPdf } = await import("../src/lib/services/contract-pdf-service");
  const t1Start = Date.now();
  const result1 = await generateContractPdf(CONTRACT_ID, userId);
  const t1ms = Date.now() - t1Start;

  if (!result1) {
    console.log("❌ generateContractPdf NULL döndü");
    return;
  }

  const file1 = path.join(STORAGE, (await prisma.contractPdfVersion.findFirst({
    where: { id: result1.pdfVersionId },
    select: { relativePath: true },
  }))!.relativePath);

  const buf1 = fs.readFileSync(file1);
  console.log(`  ContractPdfVersion ID: ${result1.pdfVersionId}`);
  console.log(`  Version: ${result1.version}`);
  console.log(`  Boyut (buffer): ${result1.buffer.length}B`);
  console.log(`  Boyut (disk):   ${buf1.length}B`);
  console.log(`  Pipeline: ${detectPipeline(buf1)}`);
  console.log(`  SHA256: ${sha256(buf1).slice(0, 32)}...`);
  console.log(`  Süre: ${t1ms}ms`);
  console.log(`  Magic: ${buf1.slice(0, 4).toString("ascii")}`);

  // ── TEST 2: generateContractDocuments (Word) — ContractPdfVersion YAZMAMALI
  console.log("\n── TEST 2: generateContractDocuments() (Word belgesi) ──");
  const { generateContractDocuments } = await import("../src/lib/services/contract-pdf-service");
  const pdfCountBefore = await prisma.contractPdfVersion.count({ where: { contractId: CONTRACT_ID } });

  const result2 = await generateContractDocuments(CONTRACT_ID, userId);
  const pdfCountAfter = await prisma.contractPdfVersion.count({ where: { contractId: CONTRACT_ID } });

  if (!result2) {
    console.log("  ❌ generateContractDocuments NULL döndü");
  } else {
    console.log(`  wordDocumentId: ${result2.wordDocumentId}`);
    console.log(`  ContractPdfVersion sayısı önce: ${pdfCountBefore} | sonra: ${pdfCountAfter}`);
    console.log(`  Yeni ContractPdfVersion oluştu mu? ${pdfCountAfter > pdfCountBefore ? "❌ EVET (HATALI!)" : "✅ HAYIR (doğru)"}`);
    // Verify DOCX file exists
    const docLink = await prisma.documentLink.findFirst({
      where: { entityId: CONTRACT_ID, entityType: "CONTRACT", document: { id: result2.wordDocumentId } },
      select: { label: true, document: { select: { originalName: true, sizeBytes: true, relativePath: true } } },
    });
    if (docLink) {
      console.log(`  Word belgesi: ${docLink.document.originalName} (${docLink.document.sizeBytes}B)`);
      console.log(`  Label: ${docLink.label}`);
    }
  }

  // ── TEST 3: generateContractPdf (imzalı — stamp)
  console.log("\n── TEST 3: generateContractPdf({ includeStamp: true }) (imzalı) ──");
  const t3Start = Date.now();
  const result3 = await generateContractPdf(CONTRACT_ID, userId, { includeStamp: true });
  const t3ms = Date.now() - t3Start;

  if (!result3) {
    console.log("  ❌ generateContractPdf NULL döndü");
  } else {
    const dbv3 = await prisma.contractPdfVersion.findFirst({
      where: { id: result3.pdfVersionId },
      select: { relativePath: true },
    });
    const buf3 = fs.readFileSync(path.join(STORAGE, dbv3!.relativePath));
    console.log(`  ContractPdfVersion ID: ${result3.pdfVersionId}`);
    console.log(`  Version: ${result3.version}`);
    console.log(`  Boyut: ${buf3.length}B`);
    console.log(`  Pipeline: ${detectPipeline(buf3)}`);
    console.log(`  SHA256: ${sha256(buf3).slice(0, 32)}...`);
    console.log(`  Süre: ${t3ms}ms`);

    // Compare with unsigned
    const diffBytes = buf3.length - buf1.length;
    console.log(`\n  Stamp farkı (imzalı - imzasız): ${diffBytes > 0 ? "+" : ""}${diffBytes} byte`);
    console.log(`  Hash farklı mı? ${sha256(buf1) !== sha256(buf3) ? "✅ EVET (stamp uygulandı)" : "❌ HAYIR"}`);
  }

  // ── ÖZET: tüm test sonrası ContractPdfVersion durumu
  console.log("\n── TEST SONU DB DURUMU ──");
  const finalVersions = await prisma.contractPdfVersion.findMany({
    where: { contractId: CONTRACT_ID },
    orderBy: { version: "asc" },
    select: { id: true, version: true, sizeBytes: true, createdAt: true, relativePath: true },
  });
  for (const v of finalVersions) {
    const buf = fs.readFileSync(path.join(STORAGE, v.relativePath));
    const pipeline = detectPipeline(buf);
    const isNew = v.createdAt > new Date(Date.now() - 300_000); // son 5 dakika
    console.log(`  v${v.version} | id=${v.id} | ${v.sizeBytes}B | ${pipeline} ${isNew ? "[YENİ ✅]" : "[ESKİ]"}`);
  }

  console.log(`\n  Toplam ContractPdfVersion: ${finalVersions.length}`);
  const newOnes = finalVersions.filter(v => v.createdAt > new Date(Date.now() - 300_000));
  const libreOnes = finalVersions.filter(v => {
    const buf = fs.readFileSync(path.join(STORAGE, v.relativePath));
    return buf.toString("latin1").includes("LibreOffice");
  });
  console.log(`  Bu testte oluşturulan: ${newOnes.length}`);
  console.log(`  LibreOffice PDFler: ${libreOnes.length} (eskiler, bu testten değil)`);
}

main()
  .catch((e) => { console.error("HATA:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
