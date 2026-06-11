import type { NextConfig } from "next";

// Production'da zayıf secret uyarısı
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
  // Oracle Cloud deployment için standalone build — daha az RAM kullanımı
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
