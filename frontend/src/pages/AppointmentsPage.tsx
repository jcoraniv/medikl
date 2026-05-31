import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { appointmentsService } from '@/services/appointmentsService';
import { useAuthStore } from '@/store/authStore';
import type { Appointment, AppointmentStatus } from '@/types/appointment';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { StudyResultForm } from '@/components/appointments/StudyResultForm';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function AppointmentRow({
  appointment,
  canWrite,
  onCancel,
  onComplete,
  onEmitResult,
}: {
  appointment: Appointment;
  canWrite: boolean;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onEmitResult: (appointment: Appointment) => void;
}) {
  const canEmit = canWrite && (appointment.status === 'scheduled' || appointment.status === 'completed');

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">#{appointment.code}</td>
      <td className="py-3 pr-4 text-sm">
        <span>{appointment.patient?.fullName ?? '—'}</span>
        <span className="ml-1 text-xs text-muted-foreground font-mono">HC-{appointment.patient?.code}</span>
      </td>
      <td className="py-3 pr-4 text-sm">{appointment.doctor?.fullName ?? '—'}</td>
      <td className="py-3 pr-4 text-sm">{appointment.studyType?.name ?? '—'}</td>
      <td className="py-3 pr-4 text-sm">
        {new Date(appointment.scheduledDate).toLocaleString()}
      </td>
      <td className="py-3 pr-4">
        <Badge className={STATUS_STYLES[appointment.status]}>{appointment.status}</Badge>
      </td>
      <td className="py-3 text-right">
        <div className="flex justify-end gap-2">
          {appointment.status === 'scheduled' && (
            <>
              <Button size="sm" variant="outline" onClick={() => onComplete(appointment.id)}>
                Complete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onCancel(appointment.id)}>
                Cancel
              </Button>
            </>
          )}
          {canEmit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEmitResult(appointment)}
              className="gap-1"
            >
              <FileText size={13} />
              Emit result
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === 'admin' || user?.role === 'doctor';

  const [newOpen, setNewOpen] = useState(false);
  const [resultAppointment, setResultAppointment] = useState<Appointment | null>(null);

  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsService.getAll(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage medical appointments</p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="gap-2">
          <Plus size={16} />
          New appointment
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : appointments.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No appointments yet.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {['#', 'Patient', 'Doctor', 'Study type', 'Date', 'Status', ''].map((h) => (
                  <th key={h} className="py-3 pr-4 text-left text-xs font-medium text-muted-foreground uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="px-4">
              {appointments.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  canWrite={canWrite}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  onComplete={(id) => completeMutation.mutate(id)}
                  onEmitResult={setResultAppointment}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New appointment dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
            <DialogDescription>Fill in the details to schedule a new appointment.</DialogDescription>
          </DialogHeader>
          <AppointmentForm
            onSuccess={() => {
              setNewOpen(false);
              queryClient.invalidateQueries({ queryKey: ['appointments'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Emit result dialog */}
      <Dialog open={resultAppointment !== null} onOpenChange={(open) => !open && setResultAppointment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Emit study result</DialogTitle>
            <DialogDescription>
              Enter the clinical findings for this appointment.
            </DialogDescription>
          </DialogHeader>
          {resultAppointment && (
            <StudyResultForm
              appointment={resultAppointment}
              onSuccess={() => setResultAppointment(null)}
              onCancel={() => setResultAppointment(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
