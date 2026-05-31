import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, ClipboardList, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { appointmentsService } from '@/services/appointmentsService';
import { studyResultsService } from '@/services/studyResultsService';
import type { AppointmentStatus } from '@/types/appointment';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2 last:border-0">
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

export function AppointmentOverviewPage() {
  const { id } = useParams<{ id: string }>();

  const { data: appointment, isLoading: apptLoading, isError } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsService.getOne(id!),
    enabled: !!id,
  });

  const { data: results = [], isLoading: resultLoading } = useQuery({
    queryKey: ['study-result', 'by-appointment', id],
    queryFn: () => studyResultsService.getByAppointment(id!),
    enabled: !!id,
  });

  const result = results[0] ?? null;

  if (apptLoading || resultLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="p-8">
        <BackLink />
        <p className="text-sm text-destructive">Appointment not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <BackLink />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Appointment #{appointment.code}</h1>
        <Badge className={STATUS_STYLES[appointment.status]}>{appointment.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar size={16} />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label="Patient"
              value={
                appointment.patient && (
                  <>
                    {appointment.patient.fullName}
                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                      HC-{appointment.patient.code}
                    </span>
                  </>
                )
              }
            />
            <DetailRow label="Doctor"      value={appointment.doctor?.fullName} />
            <DetailRow label="Study Type"  value={appointment.studyType?.name} />
            <DetailRow label="Date"        value={new Date(appointment.scheduledDate).toLocaleString()} />
            <DetailRow label="Duration"    value={`${appointment.duration} min`} />
            <DetailRow label="Reason"      value={appointment.reason} />
            <DetailRow label="Notes"       value={appointment.notes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList size={16} />
              Study Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-0">
                <DetailRow label="Findings"   value={result.findings} />
                <DetailRow label="Conclusion" value={result.conclusion} />
                <DetailRow label="Emitted by" value={result.doctor?.fullName} />
                <DetailRow label="Date"       value={new Date(result.createdAt).toLocaleString()} />
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No result yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/appointments"
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft size={14} />
      Back to Appointments
    </Link>
  );
}
