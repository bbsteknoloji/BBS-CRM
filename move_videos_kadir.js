'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

// ─── Sabitler ────────────────────────────────────────────────────────────────
const SOURCE_ROOT = 'E:\\kadir';
const TARGET_DIR  = 'E:\\kadir\\mpg';

const VIDEO_EXTS = new Set([
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
  '.webm', '.m4v', '.mpeg', '.mpg', '.ts', '.m2ts', '.3gp'
]);

// ─── İstatistik ──────────────────────────────────────────────────────────────
const report = {
  total:   0,
  moved:   0,
  deleted: 0,   // içerik aynı → kaynak kopya silindi
  renamed: 0,   // çakışan ad ama farklı içerik → yeniden adlandırıldı
  errors:  []
};

// ─── Güvenlik: kaynak kökü dışına çıkışı engelle ─────────────────────────────
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

// ─── Büyük dosyalar için akış tabanlı SHA-256 ─────────────────────────────────
// readFileSync belleği patlatır; 64 KB'lık parçalarla okur.
function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  const fd   = fs.openSync(filePath, 'r');
  const buf  = Buffer.allocUnsafe(64 * 1024);
  let n;
  try {
    while ((n = fs.readSync(fd, buf, 0, buf.length)) > 0) {
      hash.update(buf.subarray(0, n));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

// ─── Kopya kontrolü ──────────────────────────────────────────────────────────
// Dönüş: 'no_conflict' | 'duplicate' | 'different'
function checkDuplicate(srcPath, targetFilename) {
  const existingPath = path.join(TARGET_DIR, targetFilename);
  if (!fs.existsSync(existingPath)) return 'no_conflict';

  const srcSize = fs.statSync(srcPath).size;
  const dstSize = fs.statSync(existingPath).size;

  if (srcSize !== dstSize) return 'different';

  // Boyut eşit → içerik karşılaştırması için SHA-256
  const rel = path.relative(SOURCE_ROOT, srcPath);
  console.log(`  [hash] Boyut eşit, SHA-256 hesaplanıyor: ${rel}`);
  const srcHash = sha256(srcPath);
  const dstHash = sha256(existingPath);

  return srcHash === dstHash ? 'duplicate' : 'different';
}

// ─── Farklı içerikli çakışma için benzersiz hedef yolu ───────────────────────
function uniquePath(filename) {
  const ext  = path.extname(filename);
  const base = path.basename(filename, ext);
  for (let n = 1; ; n++) {
    const candidate = path.join(TARGET_DIR, `${base}_${n}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
  }
}

// ─── Tek dosyayı işle ────────────────────────────────────────────────────────
function processFile(srcPath) {
  assertSafePath(srcPath);

  const filename = path.basename(srcPath);
  const rel      = path.relative(SOURCE_ROOT, srcPath);
  const status   = checkDuplicate(srcPath, filename);

  // ── Aynı içerik: kaynağı sil ────────────────────────────────────────────
  if (status === 'duplicate') {
    try {
      fs.unlinkSync(srcPath);
      report.deleted++;
      console.log(`  [=]  Kopya → silindi  : ${rel}`);
    } catch (err) {
      report.errors.push(`Silme başarısız: ${srcPath} — ${err.message}`);
      console.error(`  [HATA] Silme: ${rel} — ${err.message}`);
    }
    return;
  }

  // ── Çakışma yok veya farklı içerik: taşı ────────────────────────────────
  let destPath;
  let renamed = false;

  if (status === 'no_conflict') {
    destPath = path.join(TARGET_DIR, filename);
  } else {                      // 'different'
    destPath = uniquePath(filename);
    renamed  = true;
  }

  try {
    fs.renameSync(srcPath, destPath);
    report.moved++;
    if (renamed) {
      report.renamed++;
      console.log(`  [→R] Farklı, yeniden adlandırıldı: ${rel}`);
      console.log(`       ↳ ${path.basename(destPath)}`);
    } else {
      console.log(`  [→]  Taşındı          : ${rel}`);
    }
  } catch (err) {
    report.errors.push(`Taşıma başarısız: ${srcPath} — ${err.message}`);
    console.error(`  [HATA] Taşıma: ${rel} — ${err.message}`);
  }
}

// ─── Dizini özyinelemeli tara ─────────────────────────────────────────────────
function scanDir(dir) {
  assertSafePath(dir);

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    report.errors.push(`Klasör okunamadı: ${dir} — ${err.message}`);
    console.error(`  [HATA] Klasör: ${dir} — ${err.message}`);
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
        processFile(fullPath);
      }
    }
  }
}

// ─── Rapor ───────────────────────────────────────────────────────────────────
function printReport() {
  const line = '─'.repeat(60);
  console.log(`\n${line}`);
  console.log('  SONUÇ RAPORU');
  console.log(line);
  console.log(`  Toplam video bulundu          : ${report.total}`);
  console.log(`  Taşınan                       : ${report.moved}`);
  console.log(`  Kopya olduğu için silinen     : ${report.deleted}`);
  console.log(`    └─ yeniden adlandırılan     : ${report.renamed}`);
  console.log(`  Hata sayısı                   : ${report.errors.length}`);

  if (report.errors.length > 0) {
    console.log('\n  Hata Listesi:');
    report.errors.forEach((e, i) => console.log(`    ${i + 1}. ${e}`));
  }
  console.log(line);
}

// ─── Ana akış ────────────────────────────────────────────────────────────────
(function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     BBS Video Taşıyıcı v2  —  move_videos_kadir.js      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Kaynak : ${SOURCE_ROOT}`);
  console.log(`  Hedef  : ${TARGET_DIR}`);
  console.log('');

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`[HATA] Kaynak klasör bulunamadı: ${SOURCE_ROOT}`);
    process.exit(1);
  }

  ensureTargetDir();
  console.log('\n  Tarama başlıyor...\n');
  scanDir(SOURCE_ROOT);
  printReport();
})();
