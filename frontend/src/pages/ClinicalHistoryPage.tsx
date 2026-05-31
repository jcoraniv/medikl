import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  clinicalHistoryService,
  type ClinicalHistoryAppointment,
} from '@/services/clinicalHistoryService';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  scheduled: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
};

function DetailRow({ label, value }: { label: string; value?: React.ReactNode | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="min-w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AppointmentCard({ appt }: { appt: ClinicalHistoryAppointment }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">
            <Link
              to={`/appointments/${appt.id}`}
              className="underline hover:text-muted-foreground transition-colors"
            >
              #{appt.code}
            </Link>
          </CardTitle>
          <Badge variant={STATUS_VARIANTS[appt.status] ?? 'secondary'}>
            {STATUS_LABELS[appt.status] ?? appt.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <DetailRow label="Doctor"      value={appt.doctor.fullName} />
          <DetailRow label="Study type"  value={appt.studyType?.name} />
          <DetailRow label="Date"        value={new Date(appt.scheduledDate).toLocaleString()} />
          <DetailRow label="Duration"    value={`${appt.duration} min`} />
          <DetailRow label="Reason"      value={appt.reason} />
          <DetailRow label="Notes"       value={appt.notes} />
        </div>

        <div className="border-t pt-4">
          {appt.studyResult ? (
            <div className="space-y-1.5">
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Study Result
              </p>
              <DetailRow label="Findings"   value={appt.studyResult.findings} />
              <DetailRow label="Conclusion" value={appt.studyResult.conclusion} />
              <DetailRow
                label="Emitted"
                value={new Date(appt.studyResult.createdAt).toLocaleDateString()}
              />
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">No study result yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClinicalHistoryPage() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') ?? '';
  const [code, setCode] = useState(initialCode);

  const mutation = useMutation({
    mutationFn: (c: number) => clinicalHistoryService.findByPatientCode(c),
  });

  useEffect(() => {
    const parsed = parseInt(initialCode, 10);
    if (!isNaN(parsed)) mutation.mutate(parsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(code.trim(), 10);
    if (!isNaN(parsed)) mutation.mutate(parsed);
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clinical History</h1>
        <p className="text-muted-foreground">
          Search a patient&apos;s complete appointment history by code
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Patient code (e.g. 1, 42)"
          type="number"
          min={1}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={mutation.isPending || !code.trim()}
          className="gap-2"
        >
          {mutation.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Search size={15} />
          )}
          Search
        </Button>
      </form>

      {mutation.isError && (
        <p className="text-sm text-destructive">Patient not found or an error occurred.</p>
      )}

      {mutation.data && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <User size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{mutation.data.patient.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  HC-{mutation.data.patient.code} · {mutation.data.patient.email}
                </p>
              </div>
              <span className="ml-auto text-sm text-muted-foreground">
                {mutation.data.appointments.length} appointment(s)
              </span>
            </CardContent>
          </Card>

          {mutation.data.appointments.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No appointments found.</p>
          ) : (
            <div className="space-y-4">
              {mutation.data.appointments.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
