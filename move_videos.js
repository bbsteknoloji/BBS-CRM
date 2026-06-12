'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Sabitler ────────────────────────────────────────────────────────────────
const SOURCE_ROOT = 'E:\\nilay';
const TARGET_DIR  = 'E:\\nilay\\mpg';

const VIDEO_EXTS = new Set([
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
  '.webm', '.m4v', '.mpeg', '.mpg', '.ts', '.m2ts', '.3gp'
]);

// ─── İstatistik ──────────────────────────────────────────────────────────────
const report = {
  total:   0,
  moved:   0,
  skipped: 0,
  errors:  []
};

// ─── Güvenlik kontrolü ───────────────────────────────────────────────────────
function assertSafePath(p) {
  const resolved = path.resolve(p);
  const root     = path.resolve(SOURCE_ROOT);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`GÜVENLİK: İzin verilmeyen yol → ${resolved}`);
  }
}

// ─── Hedef klasörü oluştur ───────────────────────────────────────────────────
function ensureTargetDir() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`[+] Klasör oluşturuldu : ${TARGET_DIR}`);
  } else {
    console.log(`[i] Hedef klasör mevcut: ${TARGET_DIR}`);
  }
}

// ─── Benzersiz hedef yolu üret ───────────────────────────────────────────────
// Çakışma varsa dosyaadı_1.ext, dosyaadı_2.ext … şeklinde isim üretir.
function uniquePath(filename) {
  const ext  = path.extname(filename);
  const base = path.basename(filename, ext);

  let candidate = path.join(TARGET_DIR, filename);
  if (!fs.existsSync(candidate)) return candidate;

  for (let n = 1; ; n++) {
    candidate = path.join(TARGET_DIR, `${base}_${n}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
  }
}

// ─── Tek dosyayı taşı ────────────────────────────────────────────────────────
function moveFile(srcPath) {
  assertSafePath(srcPath);

  const filename   = path.basename(srcPath);
  const destPath   = uniquePath(filename);
  const isRenamed  = path.basename(destPath) !== filename;

  try {
    // Aynı sürücü içinde rename atomiktir; sil+kopyala gerekmez.
    fs.renameSync(srcPath, destPath);
    report.moved++;

    const tag = isRenamed ? '[→ yeniden adlandırıldı]' : '[→]';
    console.log(`  ${tag} ${path.relative(SOURCE_ROOT, srcPath)}`);
    if (isRenamed) console.log(`       ↳ ${path.basename(destPath)}`);
  } catch (err) {
    report.skipped++;
    const msg = `Taşıma başarısız: ${srcPath} — ${err.message}`;
    report.errors.push(msg);
    console.error(`  [HATA] ${msg}`);
  }
}

// ─── Dizini özyinelemeli tara ─────────────────────────────────────────────────
function scanDir(dir) {
  assertSafePath(dir);

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    const msg = `Klasör okunamadı: ${dir} — ${err.message}`;
    report.errors.push(msg);
    console.error(`  [HATA] ${msg}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Hedef klasörü tarama döngüsüne dahil etme
      if (path.resolve(fullPath) === path.resolve(TARGET_DIR)) continue;
      scanDir(fullPath);

    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VIDEO_EXTS.has(ext)) {
        report.total++;
        moveFile(fullPath);
      }
    }
  }
}

// ─── Rapor yazdır ────────────────────────────────────────────────────────────
function printReport() {
  const line = '─'.repeat(60);
  console.log(`\n${line}`);
  console.log('  SONUÇ RAPORU');
  console.log(line);
  console.log(`  Toplam video bulundu   : ${report.total}`);
  console.log(`  Başarıyla taşınan      : ${report.moved}`);
  console.log(`  Atlanan (hatalı)       : ${report.skipped}`);
  console.log(`  Hata sayısı            : ${report.errors.length}`);

  if (report.errors.length > 0) {
    console.log(`\n  Hata Listesi:`);
    report.errors.forEach((e, i) => console.log(`    ${i + 1}. ${e}`));
  }

  console.log(line);
}

// ─── Ana akış ────────────────────────────────────────────────────────────────
(function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          BBS Video Taşıyıcı  —  move_videos.js          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Kaynak : ${SOURCE_ROOT}`);
  console.log(`  Hedef  : ${TARGET_DIR}`);
  console.log('');

  // SOURCE_ROOT gerçekten var mı?
  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`[HATA] Kaynak klasör bulunamadı: ${SOURCE_ROOT}`);
    process.exit(1);
  }

  ensureTargetDir();
  console.log('\n  Tarama başlıyor...\n');
  scanDir(SOURCE_ROOT);
  printReport();
})();
