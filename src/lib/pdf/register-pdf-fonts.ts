import { Font } from "@react-pdf/renderer";
import path from "path";

let registered = false;

/** Türkçe karakter ve ₺ desteği için Roboto (sunucu tarafı PDF). */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: "Roboto",
    fonts: [
      {
        src: path.join(fontsDir, "Roboto-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: path.join(fontsDir, "Roboto-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });
}

export const PDF_FONT_FAMILY = "Roboto";
