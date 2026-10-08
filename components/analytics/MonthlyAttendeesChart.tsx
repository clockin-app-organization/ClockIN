"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MonthlyAttendeesChartClient = dynamic(
  () => import("./MonthlyAttendeesChartClient"),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />,
  }
);

interface MonthlyData {
  month: string;
  count: number;
}

export default function MonthlyAttendeesChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/monthly-attendees")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Attendees per month</h2>
          <p className="text-xs text-gray-400 dark:text-slate-400">
            Last 12 months &middot; {total} total attendees
          </p>
        </div>
      </div>
      <MonthlyAttendeesChartClient data={data} />
    </div>
  );
}
