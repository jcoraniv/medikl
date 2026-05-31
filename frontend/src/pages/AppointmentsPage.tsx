import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { appointmentsService } from '@/services/appointmentsService';
import type { Appointment, AppointmentStatus } from '@/types/appointment';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function AppointmentRow({
  appointment,
  onCancel,
  onComplete,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 text-sm">{appointment.patient?.fullName ?? '—'}</td>
      <td className="py-3 pr-4 text-sm">{appointment.doctor?.fullName ?? '—'}</td>
      <td className="py-3 pr-4 text-sm">{appointment.studyType?.name ?? '—'}</td>
      <td className="py-3 pr-4 text-sm">
        {new Date(appointment.scheduledDate).toLocaleString()}
      </td>
      <td className="py-3 pr-4">
        <Badge className={STATUS_STYLES[appointment.status]}>{appointment.status}</Badge>
      </td>
      <td className="py-3 text-right">
        {appointment.status === 'scheduled' && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onComplete(appointment.id)}>
              Complete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onCancel(appointment.id)}>
              Cancel
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

export function AppointmentsPage() {
  const [open, setOpen] = useState(false);
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
        <Button onClick={() => setOpen(true)} className="gap-2">
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
                {['Patient', 'Doctor', 'Study type', 'Date', 'Status', ''].map((h) => (
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
                  onCancel={(id) => cancelMutation.mutate(id)}
                  onComplete={(id) => completeMutation.mutate(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => { setOpen(false); queryClient.invalidateQueries({ queryKey: ['appointments'] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
