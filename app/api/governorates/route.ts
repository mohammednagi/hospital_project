import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const governorates = await prisma.governorate.findMany({
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ governorates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
