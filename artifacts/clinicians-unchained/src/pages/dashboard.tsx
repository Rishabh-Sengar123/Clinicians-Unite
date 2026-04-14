import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock, Activity, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of AI-assisted prescription resolution.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Prescriptions" 
          value={summary?.total} 
          icon={FileText} 
          loading={isLoadingSummary}
        />
        <StatCard 
          title="Pending Resolution" 
          value={summary?.pending} 
          icon={Clock} 
          loading={isLoadingSummary}
          alert={summary && summary.pending > 0}
        />
        <StatCard 
          title="Approved (AI)" 
          value={summary?.approved} 
          icon={CheckCircle} 
          loading={isLoadingSummary}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="Rejected / Escalated" 
          value={summary?.rejected} 
          icon={XCircle} 
          loading={isLoadingSummary}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7 mt-8">
        <Card className="md:col-span-4 border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent AI Interventions
            </CardTitle>
            <CardDescription>
              Latest automated processes and outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingActivity ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-2"><Skeleton className="h-4 w-[200px]" /><Skeleton className="h-3 w-[150px]" /></div>
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                ))}
              </div>
            ) : activity?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>No recent activity found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activity?.map((item) => (
                  <Link key={item.id} href={`/prescriptions/${item.id}`} className="block hover:bg-slate-50 transition-colors p-4 md:p-6 group">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-sm leading-none">{item.drug}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="text-xs">{format(new Date(item.createdAt), 'MMM d, h:mm a')}</span>
                          {item.actionTaken && (
                            <>
                              <span>&bull;</span>
                              <span className="font-medium text-slate-700 truncate max-w-[200px]">{item.actionTaken}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
              <Link href="/prescriptions" className="text-sm font-medium text-primary hover:underline flex items-center justify-center w-full">
                View all prescriptions
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 border-slate-200 shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
          <CardHeader>
            <CardTitle className="text-xl">Workflow Engine Active</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              The AI agent is currently monitoring and processing incoming rejections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-primary-foreground/80 text-sm">Processing Queue</span>
                <span className="font-bold text-2xl">{summary?.processing || 0}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>System Load</span>
                  <span>Normal</span>
                </div>
                <div className="h-2 w-full bg-primary-foreground/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '24%' }}></div>
                </div>
              </div>
              
              <Link href="/submit" className="block w-full">
                <div className="w-full bg-white text-primary text-center py-2.5 rounded-md font-medium text-sm hover:bg-white/90 transition-colors mt-8 cursor-pointer">
                  Submit Manual Rejection
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, alert, trend, trendUp }: { 
  title: string, 
  value?: number, 
  icon: any, 
  loading: boolean,
  alert?: boolean,
  trend?: string,
  trendUp?: boolean
}) {
  return (
    <Card className="border-slate-200 shadow-sm relative overflow-hidden">
      {alert && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-amber-500' : 'text-slate-400'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 mt-1" />
        ) : (
          <div className="flex items-baseline gap-3 mt-1">
            <div className={`text-3xl font-bold ${alert ? 'text-amber-600' : ''}`}>{value || 0}</div>
            {trend && (
              <span className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-destructive'}`}>
                {trend}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
