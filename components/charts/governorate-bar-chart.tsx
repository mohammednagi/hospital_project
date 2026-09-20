"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocale } from "next-intl";

interface Props {
  data: {
    code: string;
    nameAr: string;
    nameEn: string;
    appointmentsCount: number;
  }[];
}

export function GovernorateBarChart({ data }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const chartData = data.slice(0, 8).map((d) => ({
    name: isRtl ? d.nameAr : d.nameEn,
    appointments: d.appointmentsCount,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "currentColor" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            reversed={isRtl}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "currentColor" }}
            orientation={isRtl ? "right" : "left"}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              fontSize: "0.75rem",
              direction: isRtl ? "rtl" : "ltr",
            }}
          />
          <Bar
            dataKey="appointments"
            name={isRtl ? "عدد الكشوفات" : "Appointments"}
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
