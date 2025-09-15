"use client";
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsChart() {
  const [range, setRange] = useState(7);
  const [data, setData] = useState<Array<{ day: string; count: number }>>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/analytics/views?range=${range}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    })();
  }, [range]);
  return (
    <div className="px-4 lg:px-6 space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">Visitors (last)</div>
        <select className="border rounded px-2 py-1 text-sm" value={range} onChange={(e)=>setRange(Number(e.target.value))}>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>
      <div className="h-56 w-full rounded border">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} hide={false} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals stroke="var(--color-muted-foreground)" />
            <Tooltip formatter={(v)=>[String(v),'Visitors']} contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
            <Area type="monotone" dataKey="count" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.25} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-chart-1)' }} />
        Visitors
      </div>
    </div>
  );
}
