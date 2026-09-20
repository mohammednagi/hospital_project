import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ specialties });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
