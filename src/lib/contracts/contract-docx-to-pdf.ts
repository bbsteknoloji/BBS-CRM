import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const LO_PROGRAM_DIR =
  process.env.LIBREOFFICE_PROGRAM_DIR ??
  "C:\\Program Files\\LibreOffice\\program";

const SOFFICE_CANDIDATES = [
  process.env.LIBREOFFICE_PATH,
  path.join(LO_PROGRAM_DIR, "soffice.com"),
  path.join(LO_PROGRAM_DIR, "soffice.exe"),
  "C:\\Program Files\\LibreOffice\\program\\soffice.com",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  "soffice",
  "libreoffice",
].filter(Boolean) as string[];

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

function sofficeEnv(binary: string): NodeJS.ProcessEnv {
  // Only inject LO-specific env on Windows with an absolute path binary
  if (process.platform !== "win32" || (!binary.includes("\\") && !binary.includes("/"))) {
    return process.env;
  }

  const loDir = path.dirname(binary);
  const loFwd = loDir.replace(/\\/g, "/");
  return {
    ...process.env,
    PATH: `${loDir};${process.env.PATH ?? ""}`,
    URE_BOOTSTRAP: `vnd.sun.star.pathname:${loFwd}/fundamental.ini`,
  };
}

function sofficeCwd(binary: string): string | undefined {
  if (binary.includes("\\") || binary.includes("/")) {
    return path.dirname(binary);
  }
  return undefined;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPdf(outputPath: string, timeoutMs = 30_000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const stat = await fs.stat(outputPath);
      if (stat.size > 0) return true;
    } catch {
      // dosya henüz yok
    }
    await sleep(250);
  }
  return false;
}

export class DocxToPdfError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DocxToPdfError";
    if (cause instanceof Error) this.cause = cause;
  }
}

async function convertViaLibreOffice(
  docxPath: string,
  pdfPath: string,
  outDir: string
): Promise<void> {
  let lastError: unknown;
  let lastStderr = "";

  for (const binary of uniquePaths(SOFFICE_CANDIDATES)) {
    try {
      const { stderr } = await execFileAsync(
        binary,
        [
          "--headless",
          "--nologo",
          "--nofirststartwizard",
          "--convert-to",
          "pdf",
          "--outdir",
          outDir,
          docxPath,
        ],
        {
          timeout: 120_000,
          windowsHide: true,
          cwd: sofficeCwd(binary),
          env: sofficeEnv(binary),
        }
      );

      lastStderr = stderr?.toString() ?? "";
      const ready = await waitForPdf(pdfPath);
      if (ready) return;

      throw new Error(lastStderr || "LibreOffice PDF üretmedi");
    } catch (e) {
      lastError = e;
      if (e && typeof e === "object" && "stderr" in e) {
        lastStderr = String((e as { stderr?: Buffer }).stderr ?? "");
      }
    }
  }

    throw new DocxToPdfError(
      "PDF oluşturulamadı. LibreOffice veya Microsoft Word dönüşümü başarısız.",
      lastError
    );
}

async function convertViaWord(docxPath: string, pdfPath: string): Promise<void> {
  if (process.platform !== "win32") {
    throw new DocxToPdfError("Microsoft Word yalnızca Windows'ta kullanılabilir.");
  }

  const inPath = docxPath.replace(/'/g, "''");
  const outPath = pdfPath.replace(/'/g, "''");

  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$word = New-Object -ComObject Word.Application",
    "$word.Visible = $false",
    "try {",
    `  $doc = $word.Documents.Open('${inPath}', $false, $true)`,
    "  $format = 17",
    `  $doc.SaveAs([ref]'${outPath}', [ref]$format)`,
    "  $doc.Close()",
    "} finally {",
    "  $word.Quit()",
    "  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)",
    "}",
  ].join("; ");

  try {
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { timeout: 120_000, windowsHide: true }
    );
  } catch (e) {
    const stderr =
      e && typeof e === "object" && "stderr" in e
        ? String((e as { stderr?: Buffer }).stderr ?? "")
        : "";
    throw new DocxToPdfError(
      `Microsoft Word dönüşümü başarısız.${stderr ? ` ${stderr.trim()}` : ""}`,
      e
    );
  }

  const ready = await waitForPdf(pdfPath);
  if (!ready) {
    throw new DocxToPdfError("Microsoft Word PDF üretmedi.");
  }
}

/**
 * DOCX → PDF: önce LibreOffice, Windows'ta Word yedek.
 */
export async function convertContractDocxToPdf(
  docxBuffer: Buffer
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(
    path.join(process.platform === "win32" ? "C:\\temp" : os.tmpdir(), "bbs-contract-")
  );
  const inputPath = path.join(tmpDir, "contract.docx");
  const outputPath = path.join(tmpDir, "contract.pdf");

  try {
    await fs.writeFile(inputPath, docxBuffer);

    try {
      await convertViaLibreOffice(inputPath, outputPath, tmpDir);
    } catch (loError) {
      if (process.platform === "win32") {
        await convertViaWord(inputPath, outputPath);
      } else {
        throw loError;
      }
    }

    const pdf = await fs.readFile(outputPath);
    if (pdf.length === 0) {
      throw new DocxToPdfError("Oluşturulan PDF boş.");
    }
    return pdf;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
