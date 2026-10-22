import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { emptyTrashForUser } from "@/lib/server/projectService";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const result = await emptyTrashForUser(user.id);
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Failed to empty trash:", error);
    return NextResponse.json({ error: "Failed to empty trash." }, { status: 500 });
  }
}
