import type { NextConfig } from "next";

// Production'da zayıf secret uyarısı — next.config'de throw yerine console.warn
// Gerçek runtime engeli src/auth.ts içinde uygulanabilir
if (process.env.NODE_ENV === "production") {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const WEAK_SECRETS = ["", "bbs-crm-local-secret", "secret", "changeme", "your-secret"];
  if (WEAK_SECRETS.includes(secret)) {
    console.warn(
      "[SECURITY WARNING] AUTH_SECRET zayıf veya boş. Production ortamında güçlü bir değer kullanın."
    );
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
