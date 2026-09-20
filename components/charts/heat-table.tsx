"use client";

import { useLocale } from "next-intl";

interface Props {
  data: {
    specialtyCode: string;
    specialtyNameAr: string;
    specialtyNameEn: string;
    governorates: {
      governorateCode: string;
      nameAr: string;
      nameEn: string;
      waitDays: number;
    }[];
  }[];
}

export function HeatTable({ data }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (!data || data.length === 0) return null;

  const govs = data[0].governorates;

  const getHeatColor = (days: number) => {
    if (days <= 2.0) {
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    }
    if (days <= 4.0) {
      return "bg-amber-100 text-amber-900 border-amber-200";
    }
    return "bg-rose-100 text-rose-900 border-rose-200";
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs text-start border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="p-3 font-bold text-foreground text-start">
              {isRtl ? "التخصص الطبي" : "Medical Specialty"}
            </th>
            {govs.map((g) => (
              <th
                key={g.governorateCode}
                className="p-3 font-bold text-center text-foreground whitespace-nowrap"
              >
                {isRtl ? g.nameAr : g.nameEn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.specialtyCode}
              className="border-b border-border hover:bg-muted/10 transition-colors"
            >
              <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                {isRtl ? row.specialtyNameAr : row.specialtyNameEn}
              </td>
              {row.governorates.map((cell) => (
                <td key={cell.governorateCode} className="p-2 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${getHeatColor(
                      cell.waitDays
                    )}`}
                  >
                    {cell.waitDays} {isRtl ? "يوم" : "d"}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
