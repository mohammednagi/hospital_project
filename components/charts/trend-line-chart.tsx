"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLocale } from "next-intl";

interface Props {
  data: {
    date: string;
    booked: number;
    completed: number;
    noShow: number;
  }[];
}

export function TrendLineChart({ data }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "currentColor" }}
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
          <Legend
            wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
          />
          <Line
            type="monotone"
            dataKey="booked"
            name={isRtl ? "إجمالي الحجوزات" : "Booked"}
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name={isRtl ? "تم الكشف" : "Completed"}
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="noShow"
            name={isRtl ? "غياب (No-Show)" : "No-Show"}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
