import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suggestSpecialty } from "@/lib/smart/specialty-suggest";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query = "", locale = "ar" } = body;

    const dbSpecialties = await prisma.specialty.findMany();
    const specialtiesList = dbSpecialties.map((s) => ({
      code: s.code,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      keywordsAr: s.keywordsAr,
      keywordsEn: s.keywordsEn,
    }));

    const suggestions = suggestSpecialty(query, locale, specialtiesList);
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
