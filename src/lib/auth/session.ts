import { auth } from "@/auth";
import type { SessionUser } from "@/lib/permissions/types";

/** Sunucu tarafı oturum doğrulama — JWT içeriğinden kullanıcı bilgisi */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    companyId: session.user.companyId ?? null,
    roles: session.user.roles ?? [],
    permissions: session.user.permissions ?? [],
  };
}
