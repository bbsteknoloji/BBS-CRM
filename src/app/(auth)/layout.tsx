import { PremiumAuthLayout } from "@/components/premium/premium-auth-layout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PremiumAuthLayout>{children}</PremiumAuthLayout>;
}
