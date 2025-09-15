import { db } from "@/db";
import { posts, dailyPostViews } from "@/db/schema";
import { auth } from "@/auth-app";

export default async function StudioHome() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const allPosts = await db.select().from(posts);
  const totalVisitors = allPosts.reduce((acc: number, p: any) => acc + Number(p.views||0), 0);
  const totalPosts = allPosts.length;
  const today = new Date().toISOString().slice(0,10);
  const monthPrefix = new Date().toISOString().slice(0,7); // YYYY-MM
  const daily = await db.select().from(dailyPostViews);
  const todayVisitors = daily.filter((d:any)=> d.day === today).reduce((a:number,b:any)=>a+Number(b.count||0),0);
  const monthVisitors = daily.filter((d:any)=> d.day.startsWith(monthPrefix)).reduce((a:number,b:any)=>a+Number(b.count||0),0);

  // Admin-only queues
  const submitted = role === 'admin' ? allPosts.filter((p:any)=> String(p.status)==='submitted') : [];
  const inProgress = role === 'admin' ? allPosts.filter((p:any)=> String(p.status)==='draft' && p.assignedTo) : [];

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-4 lg:px-6">
        <MetricCard label="Total visitors" value={totalVisitors.toLocaleString()} />
        <MetricCard label="All posts" value={String(totalPosts)} />
        <MetricCard label="Visitors this month" value={monthVisitors.toLocaleString()} />
        <MetricCard label="Visitors today" value={todayVisitors.toLocaleString()} />
      </div>
      {/* Analytics chart */}
      <AnalyticsClient />
      {role === 'admin' && (
        <div className="px-4 lg:px-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminList title="Submitted posts" items={submitted} />
          <AdminList title="In progress (assigned)" items={inProgress} />
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

import AnalyticsClient from '@/components/AnalyticsClient';

function AdminList({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="rounded-lg border">
      <div className="px-3 py-2 text-sm font-medium">{title}</div>
      <div className="divide-y">
        {items.map((p:any)=>(
          <a key={p.id} href={`/studio/posts/${p.id}`} className="flex items-center justify-between p-3 hover:bg-muted/40">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground">/{p.slug}</div>
            </div>
            <div className="text-xs text-muted-foreground capitalize">{String(p.status)}</div>
          </a>
        ))}
        {items.length === 0 && <div className="p-3 text-sm text-muted-foreground">No items.</div>}
      </div>
    </div>
  );
}
