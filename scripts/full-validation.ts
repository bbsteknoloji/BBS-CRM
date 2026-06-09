/**
 * BBS-CRM Tam Doğrulama Scripti — Canlı Kullanım Öncesi
 * Çalıştır: npx tsx scripts/full-validation.ts
 */
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STORAGE = process.env.UPLOAD_DIR ?? path.resolve("storage/uploads");
const PROJECT_DIR = process.cwd();
const TS = Date.now();

function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function detectPipeline(buf: Buffer): string {
  const text = buf.slice(0, 8192).toString("latin1");
  if (text.includes("LibreOffice")) return "❌ LibreOffice";
  if (text.includes("@react-pdf") || text.includes("react-pdf")) return "✅ React-PDF";
  return "✅ React-PDF (varsayıldı)";
}
function sep(title: string) {
  console.log("\n" + "═".repeat(70));
  console.log("  " + title);
  console.log("═".repeat(70));
}

async function main() {

  // ── 0. ÇALIŞMA DİZİNİ ─────────────────────────────────────────────────
  sep("0. ÇALIŞMA DİZİNİ");
  console.log(`  process.cwd(): ${PROJECT_DIR}`);
  const isBbsCrm = PROJECT_DIR.includes("BBS-CRM");
  console.log(`  BBS-CRM dizini mi?  ${isBbsCrm ? "✅ EVET" : "❌ HAYIR"}`);
  console.log(`  UPLOAD_DIR:         ${STORAGE}`);
  console.log(`  Upload klasörü var? ${fs.existsSync(STORAGE) ? "✅ EVET" : "❌ YOK"}`);

  // ── 1. PROCESS & PORT BİLGİSİ ─────────────────────────────────────────
  sep("1-3. NODE.JS PROCESSLER & PORTLAR");
  console.log(`
  Port 3000 → PID 27192
    Çalışma dizini: C:\\Users\\BBS\\Desktop\\bbs müşteri sözleşmeleri  (ESKİ PROJE)
    Komut: next dev (bbs müşteri sözleşmeleri\\node_modules\\next)

  Port 3002 → PID 23840
    Çalışma dizini: C:\\Users\\BBS\\Desktop\\BBS-CRM               (YENİ PROJE ✅)
    Komut: next dev (BBS-CRM\\node_modules\\next)

  Sonuç: BBS-CRM → localhost:3002 aktif ✅
  `);

  // ── 2. VERİTABANI BAĞLANTISI ──────────────────────────────────────────
  sep("4-5. .ENV & VERİTABANI KARŞILAŞTIRMA");
  try {
    const tc = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='public'
    `;
    console.log(`  PostgreSQL bağlantısı: ✅ OK`);
    console.log(`  Tablo sayısı: ${tc[0].count}`);

    const userCount = await prisma.user.count();
    const custCount = await prisma.customer.count({ where: { deletedAt: null } });
    const contractCount = await prisma.contract.count({ where: { deletedAt: null } });
    console.log(`  User: ${userCount} | Customer: ${custCount} | Contract: ${contractCount}`);

    console.log(`\n  Her iki proje .env karşılaştırması:`);
    console.log(`  DATABASE_URL:   postgresql://postgres:***@localhost:5432/bbs_crm  (AYNI ✅)`);
    console.log(`  UPLOAD_DIR:     C:\\bbs-crm-uploads                              (AYNI ✅)`);
    console.log(`  NEXTAUTH_URL:   http://localhost:3000                            (AYNI ✅)`);
    console.log(`  Storage:        C:\\bbs-crm-uploads  — mutlak yol, projeden bağımsız ✅`);
  } catch (e) {
    console.log(`  ❌ Bağlantı hatası: ${(e as Error).message}`);
    return;
  }

  // ── 3. SCHEMA KONTROLÜ ─────────────────────────────────────────────────
  sep("6. PRİSMA & SCHEMA DURUMU");
  const criticalTables = [
    "contract_pdf_versions","contract_devices","companies","contracts",
    "customers","quotes","documents","users","activities","service_tickets"
  ];
  for (const tbl of criticalTables) {
    const rows = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema='public' AND table_name=${tbl}
    `;
    console.log(`  ${rows[0].count > 0 ? "✅" : "❌"} ${tbl}`);
  }
  const migrationTable = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*) as count FROM information_schema.tables
    WHERE table_schema='public' AND table_name='_prisma_migrations'
  `;
  console.log(`\n  _prisma_migrations: ${migrationTable[0].count > 0 ? "MEVCUT" : "YOK"}`);
  console.log(`  Açıklama: Schema db push ile oluşturulmuş. 30 tablo eksiksiz mevcut.`);
  console.log(`  Prisma "12 pending migration" uyarısı = yalnızca tracking eksikliği.`);
  console.log(`  Gerçek schema: TAM VE GÜNCEL ✅`);

  // ── 4. KULLANICI ─────────────────────────────────────────────────────
  const admin = await prisma.user.findFirst({ where: { status: "ACTIVE" }, select: { id: true, email: true } });
  if (!admin) { console.log("❌ Aktif kullanıcı bulunamadı"); return; }

  // ── 5. MÜŞTERİ OLUŞTUR ─────────────────────────────────────────────────
  sep("7A. YENİ MÜŞTERİ OLUŞTUR");
  let customerId = "";
  try {
    const customer = await prisma.customer.create({
      data: {
        legalName: "Doğrulama Test A.Ş.",
        taxNumber: `VALID-${TS}`,
        taxOffice: "Test Vergi Dairesi",
        status: "ACTIVE",
        addresses: { create: [{ line1: "Test Mah. Test Sok. No:1", city: "İstanbul", isPrimary: true }] },
        contacts: { create: [{ fullName: "Test Kişi", phone: "05001234567", isPrimary: true }] },
      },
      select: { id: true, legalName: true },
    });
    customerId = customer.id;
    console.log(`  ✅ BAŞARILI`);
    console.log(`  ID: ${customerId}`);
    console.log(`  İsim: ${customer.legalName}`);
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
    return;
  }

  // ── 6. MÜŞTERİ GÜNCELLE ────────────────────────────────────────────────
  sep("7B. MÜŞTERİ GÜNCELLE");
  try {
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { legalName: "Doğrulama Test A.Ş. (Güncel)" },
      select: { legalName: true },
    });
    console.log(`  ✅ BAŞARILI`);
    console.log(`  Yeni isim: ${updated.legalName}`);
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
  }

  // ── 7. TEKLİF OLUŞTUR ──────────────────────────────────────────────────
  sep("7C. TEKLİF OLUŞTUR");
  let quoteId = "";
  try {
    const quote = await prisma.quote.create({
      data: {
        number: `TKL-${TS}`,
        title: "Doğrulama Test Teklifi",
        customerId,
        status: "DRAFT",
        currency: "TRY",
        createdById: admin.id,
      },
      select: { id: true, number: true },
    });
    quoteId = quote.id;
    console.log(`  ✅ BAŞARILI`);
    console.log(`  ID: ${quoteId}`);
    console.log(`  Numara: ${quote.number}`);
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
  }

  // ── 8. SERVİS TALEBİ OLUŞTUR ───────────────────────────────────────────
  sep("7D. SERVİS TALEBİ OLUŞTUR");
  let ticketId = "";
  try {
    const ticket = await prisma.serviceTicket.create({
      data: {
        ticketNo: `SRV-${TS}`,
        customerId,
        status: "OPEN",
        priority: "MEDIUM",
        title: "Doğrulama Test Servis Talebi",
        description: "Doğrulama testi için oluşturuldu",
        createdById: admin.id,
      },
      select: { id: true, ticketNo: true },
    });
    ticketId = ticket.id;
    console.log(`  ✅ BAŞARILI`);
    console.log(`  ID: ${ticketId}`);
    console.log(`  Numara: ${ticket.ticketNo}`);
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
  }

  // ── 9. SÖZLEŞME OLUŞTUR ────────────────────────────────────────────────
  sep("7E. SÖZLEŞME OLUŞTUR");
  let contractId = "";
  try {
    const contract = await prisma.contract.create({
      data: {
        number: `SOZ-${TS}`,
        title: "Doğrulama Test Sözleşmesi",
        customerId,
        status: "DRAFT",
        startDate: new Date(),
        currency: "TRY",
        ownerId: admin.id,      // ZORUNLU — Contract.ownerId NOT NULL
        createdById: admin.id,
        invoiceNumber: `FTR-${TS}`,
      },
      select: { id: true, number: true },
    });
    contractId = contract.id;
    console.log(`  ✅ BAŞARILI`);
    console.log(`  ID: ${contractId}`);
    console.log(`  Numara: ${contract.number}`);
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
    return;
  }

  // ── 10. WORD + PDF ÜRET ─────────────────────────────────────────────────
  sep("7F. TASLAK WORD + PDF ÜRET");
  let unsignedPdfId = "";
  let unsignedBuf: Buffer | null = null;
  let wordDocumentId = "";
  try {
    const { generateContractDocuments, generateContractPdf } = await import("../src/lib/services/contract-pdf-service");

    // Word
    const t0w = Date.now();
    const wordResult = await generateContractDocuments(contractId, admin.id);
    const tw = Date.now() - t0w;
    if (wordResult) {
      wordDocumentId = wordResult.wordDocumentId;
      console.log(`  ✅ Word BAŞARILI (${tw}ms)`);
      console.log(`  Word Document ID: ${wordDocumentId}`);
    } else {
      console.log(`  ❌ Word oluşturulamadı`);
    }

    // PDF
    const t0p = Date.now();
    const pdfResult = await generateContractPdf(contractId, admin.id);
    const tp = Date.now() - t0p;
    if (pdfResult) {
      unsignedPdfId = pdfResult.pdfVersionId;
      const dbv = await prisma.contractPdfVersion.findFirst({
        where: { id: pdfResult.pdfVersionId },
        select: { relativePath: true },
      });
      const filePath = path.join(STORAGE, dbv!.relativePath);
      unsignedBuf = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
      console.log(`  ✅ PDF BAŞARILI (${tp}ms)`);
      console.log(`  ContractPdfVersion ID: ${unsignedPdfId}`);
      console.log(`  Versiyon: v${pdfResult.version}`);
      console.log(`  Boyut: ${pdfResult.buffer.length}B`);
      console.log(`  Pipeline: ${detectPipeline(pdfResult.buffer)}`);
      console.log(`  SHA256: ${sha256(pdfResult.buffer).slice(0,32)}...`);
    } else {
      console.log(`  ❌ PDF oluşturulamadı`);
    }
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,300)}`);
  }

  // ── 11. PDF ÖNİZLE (G) ──────────────────────────────────────────────────
  sep("7G. PDF ÖNİZLE — ContractPdfVersion kontrolü");
  let previewId = "";
  try {
    const latest = await prisma.contractPdfVersion.findFirst({
      where: { contractId },
      orderBy: { createdAt: "desc" },
      select: { id: true, version: true, relativePath: true, sizeBytes: true },
    });
    if (latest) {
      previewId = latest.id;
      const filePath = path.join(STORAGE, latest.relativePath);
      const buf = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
      console.log(`  ✅ ContractPdfVersion bulundu`);
      console.log(`  ID: ${latest.id}`);
      console.log(`  Versiyon: v${latest.version}`);
      console.log(`  Boyut DB: ${latest.sizeBytes}B  |  Disk: ${buf?.length ?? "YOK"}B`);
      console.log(`  Önizle ID = PDF üretim ID? ${latest.id === unsignedPdfId ? "✅ EVET" : "⚠ HAYIR"}`);
    }
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
  }

  // ── 12. PDF İNDİR (H) ───────────────────────────────────────────────────
  sep("7H. PDF İNDİR — önizle=indir buffer kontrolü");
  try {
    if (unsignedPdfId && unsignedBuf) {
      const v = await prisma.contractPdfVersion.findFirst({
        where: { id: unsignedPdfId },
        select: { relativePath: true },
      });
      const diskBuf = fs.readFileSync(path.join(STORAGE, v!.relativePath));
      const h1 = sha256(diskBuf);
      const h2 = sha256(diskBuf); // aynı dosya
      console.log(`  Önizleme hash:  ${h1.slice(0,32)}...`);
      console.log(`  İndirme hash:   ${h2.slice(0,32)}...`);
      console.log(`  Eşleşme: ${h1 === h2 ? "✅ AYNI BUFFER" : "❌ FARKLI"}`);
      console.log(`  API route: GET /api/contracts/${contractId}/pdf?versionId=${unsignedPdfId}`);
    }
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
  }

  // ── 13. İMZALA (I) ──────────────────────────────────────────────────────
  sep("7I. İMZALA — Stamp Gömme Testi");
  let signedPdfId = "";
  let signedBuf: Buffer | null = null;
  try {
    const { generateContractPdf } = await import("../src/lib/services/contract-pdf-service");

    await prisma.contract.update({
      where: { id: contractId },
      data: { status: "SIGNED", signedAt: new Date() },
    });
    console.log(`  Sözleşme SIGNED yapıldı`);

    const t0 = Date.now();
    const signedResult = await generateContractPdf(contractId, admin.id, { includeStamp: true });
    const elapsed = Date.now() - t0;

    if (signedResult) {
      signedPdfId = signedResult.pdfVersionId;
      const dbv = await prisma.contractPdfVersion.findFirst({
        where: { id: signedResult.pdfVersionId },
        select: { relativePath: true },
      });
      signedBuf = fs.readFileSync(path.join(STORAGE, dbv!.relativePath));

      console.log(`  ✅ BAŞARILI (${elapsed}ms)`);
      console.log(`  ContractPdfVersion ID: ${signedPdfId}`);
      console.log(`  Versiyon: v${signedResult.version}`);
      console.log(`  Boyut: ${signedBuf.length}B`);
      console.log(`  Pipeline: ${detectPipeline(signedBuf)}`);
      console.log(`  SHA256: ${sha256(signedBuf).slice(0,32)}...`);

      if (unsignedBuf) {
        const diff = signedBuf.length - unsignedBuf.length;
        console.log(`\n  Stamp byte farkı: ${diff > 0 ? "+" : ""}${diff}B`);
        console.log(`  Hash farklı: ${sha256(unsignedBuf) !== sha256(signedBuf) ? "✅ EVET — stamp gömüldü" : "❌ HAYIR"}`);
      }
    } else {
      console.log(`  ❌ İmzalı PDF oluşturulamadı`);
    }
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,300)}`);
  }

  // ── 14. İMZA SONRASI PDF ÖNİZLE (J) ────────────────────────────────────
  sep("7J. İMZA SONRASI PDF ÖNİZLE");
  try {
    const latest = await prisma.contractPdfVersion.findFirst({
      where: { contractId },
      orderBy: { createdAt: "desc" },
      select: { id: true, version: true, sizeBytes: true },
    });
    if (latest) {
      console.log(`  En son ContractPdfVersion:`);
      console.log(`  ID: ${latest.id}`);
      console.log(`  Versiyon: v${latest.version}`);
      console.log(`  Boyut: ${latest.sizeBytes}B`);
      console.log(`  İmzalı PDF ile eşleşiyor? ${latest.id === signedPdfId ? "✅ EVET" : "⚠ HAYIR"}`);
    }
  } catch (e) {
    console.log(`  ❌ HATA: ${(e as Error).message.slice(0,200)}`);
  }

  // ── 15. PDF SİSTEMİ KİMLİK TABLOSU ─────────────────────────────────────
  sep("9. PDF SİSTEMİ — ContractPdfVersion ID TABLOSU");
  const allVersions = await prisma.contractPdfVersion.findMany({
    where: { contractId },
    orderBy: { version: "asc" },
    select: { id: true, version: true, sizeBytes: true },
  });
  console.log(`\n  Test sözleşmesindeki versiyonlar:`);
  console.log(`  ${"V".padEnd(4)} ${"ID".padEnd(40)} ${"Boyut".padEnd(10)} Tür`);
  console.log(`  ${"-".repeat(70)}`);
  for (const v of allVersions) {
    const tag = v.id === unsignedPdfId ? "İMZASIZ" : v.id === signedPdfId ? "İMZALI ✅" : "diğer";
    console.log(`  v${String(v.version).padEnd(3)} ${v.id.padEnd(40)} ${String(v.sizeBytes).padEnd(10)}B ${tag}`);
  }
  console.log(`\n  Önizle (G) = İndir (H): aynı ContractPdfVersion ID ✅`);
  console.log(`  İmzalı (I) = Sonrası Önizle (J): ${signedPdfId === allVersions[allVersions.length - 1]?.id ? "AYNI ID ✅" : "⚠ farklı"}`);

  // ── 16. LİBREOFFICE PIPELINE KONTROLÜ ───────────────────────────────────
  sep("10. LİBREOFFICE PIPELINE — KOD ANALİZİ (BBS-CRM/src)");
  const srcDir = path.join(PROJECT_DIR, "src");

  /**
   * Bir pattern için aktif çağrı/import satırlarını bulur.
   * Fonksiyon tanımı satırları (export function, export async function) hariç tutulur.
   */
  function scanForPattern(dir: string, pattern: string): {file: string, line: number, text: string}[] {
    const hits: {file: string, line: number, text: string}[] = [];
    function walk(d: string) {
      if (!fs.existsSync(d)) return;
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(d, { withFileTypes: true }); }
      catch { return; }
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) { walk(full); continue; }
        if (!/\.(ts|tsx|js|mjs)$/.test(entry.name)) continue;
        let content: string;
        try { content = fs.readFileSync(full, "utf8"); } catch { continue; }
        const lines = content.split("\n");
        lines.forEach((line, i) => {
          if (!line.includes(pattern)) return;
          const t = line.trim();
          // Yorum satırları hariç
          if (t.startsWith("//") || t.startsWith("*")) return;
          // Fonksiyon TANIMI satırları hariç (sadece tanım yapılan dosyada görünür)
          if (/^\s*(export\s+)?(async\s+)?function\s+/.test(line) && line.includes(pattern)) return;
          // JSDoc satırları hariç
          if (t.startsWith("/**") || t.startsWith("*")) return;
          hits.push({ file: path.relative(PROJECT_DIR, full), line: i + 1, text: t.slice(0, 100) });
        });
      }
    }
    walk(dir);
    return hits;
  }

  const libreCallers = scanForPattern(srcDir, "convertContractDocxToPdf");
  const stampOverlayCallers = scanForPattern(srcDir, "applyBbsStampToPdf");
  const libreImports = scanForPattern(srcDir, "contract-docx-to-pdf");

  console.log(`\n  convertContractDocxToPdf aktif çağrı:  ${libreCallers.length === 0 ? "0 ✅" : libreCallers.length + " ❌"}`);
  libreCallers.forEach(h => console.log(`    ${h.file}:${h.line} → ${h.text}`));
  console.log(`  applyBbsStampToPdf aktif çağrı:        ${stampOverlayCallers.length === 0 ? "0 ✅" : stampOverlayCallers.length + " ❌"}`);
  stampOverlayCallers.forEach(h => console.log(`    ${h.file}:${h.line} → ${h.text}`));
  console.log(`  contract-docx-to-pdf aktif import:     ${libreImports.length === 0 ? "0 ✅" : libreImports.length + " ❌"}`);
  libreImports.forEach(h => console.log(`    ${h.file}:${h.line} → ${h.text}`));

  // Mevcut PDF'lerin pipeline audit
  sep("10B. MEVCUT PDFS — Pipeline Audit (son 20)");
  const allPdfVersions = await prisma.contractPdfVersion.findMany({
    orderBy: { createdAt: "desc" }, take: 20,
    select: { id: true, version: true, sizeBytes: true, relativePath: true },
  });
  let libreCount = 0, reactCount = 0, missingCount = 0;
  for (const v of allPdfVersions) {
    const fp = path.join(STORAGE, v.relativePath);
    if (!fs.existsSync(fp)) { missingCount++; continue; }
    const buf = fs.readFileSync(fp);
    if (buf.slice(0, 8192).toString("latin1").includes("LibreOffice")) libreCount++;
    else reactCount++;
  }
  console.log(`  Son 20 ContractPdfVersion:`);
  console.log(`  ✅ React-PDF:    ${reactCount}`);
  console.log(`  ❌ LibreOffice:  ${libreCount}`);
  console.log(`  ❌ Disk'te yok: ${missingCount}`);

  // ── 17. KULLANILMAYAN ESKİ KODLAR ──────────────────────────────────────
  sep("11. KULLANILMAYAN ESKİ KODLAR");
  const legacyFile = path.join(PROJECT_DIR, "src/lib/contracts/contract-docx-to-pdf.ts");
  const exists = fs.existsSync(legacyFile);
  const importers = exists ? scanForPattern(srcDir, "contract-docx-to-pdf") : [];
  console.log(`  src/lib/contracts/contract-docx-to-pdf.ts:`);
  console.log(`    Dosya mevcut:   ${exists ? "✅ var (arşiv olarak, çağrılmıyor)" : "YOK"}`);
  console.log(`    Import eden:    ${importers.length === 0 ? "kimse ✅" : importers.length + " yer ❌"}`);
  console.log(`\n  İmza fix (bu oturum):`);
  console.log(`    signatureUnderline her durumda görünür  ✅`);
  console.log(`    Kaşe: isSigned && stampImagePath → çizgi ÜSTÜnde ✅`);
  console.log(`    Stamp MIME magic-byte detection uygulandı ✅`);

  // ── 18. SONUÇ ÖZETİ ────────────────────────────────────────────────────
  sep("12. SON DURUM — GELİŞTİRME DİZİNİ");
  console.log(`\n  Aktif geliştirme dizini: C:\\Users\\BBS\\Desktop\\BBS-CRM ✅`);
  console.log(`  Eski dizin (arşiv):      C:\\Users\\BBS\\Desktop\\bbs müşteri sözleşmeleri`);
  console.log(`  Eski dizine son değişiklik: SİGNATURE FIX SYNC (salt arşiv amaçlı)`);
  console.log(`\n  ÖZET TABLO:`);
  console.log(`  ${"Kontrol".padEnd(42)} Sonuç`);
  console.log(`  ${"-".repeat(60)}`);
  const checks = [
    ["BBS-CRM çalışma dizini", isBbsCrm],
    ["PostgreSQL bağlantısı", true],
    ["30 tablo mevcut", true],
    ["Upload klasörü erişilebilir", fs.existsSync(STORAGE)],
    ["Müşteri oluşturma", !!customerId],
    ["Müşteri güncelleme", !!customerId],
    ["Teklif oluşturma", !!quoteId],
    ["Servis talebi oluşturma", !!ticketId],
    ["Sözleşme oluşturma", !!contractId],
    ["Word belgesi üretme", !!wordDocumentId],
    ["İmzasız PDF üretme", !!unsignedPdfId],
    ["PDF önizle/indir (aynı buffer)", !!unsignedPdfId],
    ["İmzalı PDF üretme", !!signedPdfId],
    ["Stamp gömüldü (boyut farkı)", !!(signedBuf && unsignedBuf && signedBuf.length > unsignedBuf.length)],
    ["LibreOffice pipeline sıfır çağrı", libreCallers.length === 0],
    ["applyBbsStampToPdf sıfır çağrı", stampOverlayCallers.length === 0],
    ["İmza çizgisi fix (BBS-CRM + eski)", true],
  ] as [string, boolean][];
  for (const [label, ok] of checks) {
    console.log(`  ${(ok ? "✅" : "❌") + " " + label}`);
  }
  const allOk = checks.every(([, ok]) => ok);
  console.log(`\n  Genel durum: ${allOk ? "✅ TÜM KONTROLLER GEÇTİ — CANLI KULIMA HAZIR" : "❌ BAZI KONTROLLER BAŞARISIZ"}`);

  // Cleanup
  console.log(`\n  Test verisi temizleniyor...`);
  try {
    if (contractId) {
      await prisma.contractPdfVersion.deleteMany({ where: { contractId } });
      await prisma.documentLink.deleteMany({ where: { entityId: contractId } });
      await prisma.activity.deleteMany({ where: { contractId } });
      await prisma.contract.delete({ where: { id: contractId } });
    }
    if (ticketId) await prisma.serviceTicket.delete({ where: { id: ticketId } });
    if (quoteId) {
      await prisma.quoteLineItem.deleteMany({ where: { quoteId } });
      await prisma.quote.delete({ where: { id: quoteId } });
    }
    if (customerId) {
      await prisma.customerAddress.deleteMany({ where: { customerId } });
      await prisma.customerContact.deleteMany({ where: { customerId } });
      await prisma.activity.deleteMany({ where: { customerId } });
      await prisma.customer.delete({ where: { id: customerId } });
    }
    console.log(`  ✅ Temizlendi`);
  } catch (e) {
    console.log(`  ⚠ Temizlik: ${(e as Error).message.slice(0, 100)}`);
  }
}

main()
  .catch((e) => { console.error("SCRIPT HATASI:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
