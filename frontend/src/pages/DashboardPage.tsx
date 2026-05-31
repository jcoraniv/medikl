import { useQuery } from '@tanstack/react-query';
import { Users, Stethoscope, Calendar, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService } from '@/services/dashboardService';
import type { DashboardStats } from '@/types/dashboard';

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon size={20} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function buildCards(stats: DashboardStats) {
  return [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      description: 'Registered patients',
      icon: Users,
    },
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      description: 'Active doctors',
      icon: Stethoscope,
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      description: 'All time',
      icon: Calendar,
    },
    {
      title: 'Pending Results',
      value: stats.pendingResults,
      description: 'Awaiting review',
      icon: ClipboardList,
    },
  ];
}

export function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
    staleTime: 30_000,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">System overview</p>
      </div>

      {isError && (
        <p className="mb-4 text-sm text-destructive">Failed to load stats. Is the backend running?</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats && buildCards(stats).map((card) => <StatCard key={card.title} {...card} />)}
      </div>
    </div>
  );
}
