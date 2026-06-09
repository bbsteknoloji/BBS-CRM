import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/check";
import { listCustomerDevices } from "@/lib/services/customer-device-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = {
    id: userId,
    email: session.user?.email ?? "",
    name: session.user?.name ?? "",
    roles: session.user?.roles ?? [],
    permissions: session.user?.permissions ?? [],
  };

  if (!hasPermission(user, "customer:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: customerId } = await params;
  const devices = await listCustomerDevices(user, customerId);

  return NextResponse.json({ devices });
}
