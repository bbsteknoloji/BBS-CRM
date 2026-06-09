import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Giriş",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[320px] w-full" />}>
      <LoginForm />
    </Suspense>
  );
}
