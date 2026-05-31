import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, FileText, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  showDoctor,
  onCancel,
  onComplete,
  onEmitResult,
}: {
  appointment: Appointment;
  canWrite: boolean;
  showDoctor: boolean;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onEmitResult: (appointment: Appointment) => void;
}) {
  const isScheduled = appointment.status === 'scheduled';
  const canEmit = canWrite && (isScheduled || appointment.status === 'completed');
  const hasActions = canWrite && (isScheduled || canEmit);

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">#{appointment.code}</td>
      <td className="py-3 pr-4 text-sm">
        <span>{appointment.patient?.fullName ?? '—'}</span>
        <span className="ml-1 text-xs text-muted-foreground font-mono">HC-{appointment.patient?.code}</span>
      </td>
      {showDoctor && (
        <td className="py-3 pr-4 text-sm">{appointment.doctor?.fullName ?? '—'}</td>
      )}
      <td className="py-3 pr-4 text-sm">{appointment.studyType?.name ?? '—'}</td>
      <td className="py-3 pr-4 text-sm">
        {new Date(appointment.scheduledDate).toLocaleString()}
      </td>
      <td className="py-3 pr-4">
        <Badge className={STATUS_STYLES[appointment.status]}>{appointment.status}</Badge>
      </td>
      <td className="py-3 text-right">
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal size={16} />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEmit && (
                <DropdownMenuItem onClick={() => onEmitResult(appointment)}>
                  <FileText />
                  Emit result
                </DropdownMenuItem>
              )}
              {isScheduled && canEmit && <DropdownMenuSeparator />}
              {isScheduled && (
                <>
                  <DropdownMenuItem onClick={() => onComplete(appointment.id)}>
                    <CheckCircle />
                    Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onCancel(appointment.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}

export function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === 'admin' || user?.role === 'doctor';
  const showDoctor = user?.role !== 'doctor';

  const [newOpen, setNewOpen] = useState(false);
  const [resultAppointment, setResultAppointment] = useState<Appointment | null>(null);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', page],
    queryFn: () => appointmentsService.getAll({ page }),
  });

  const appointments = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  function handlePageChange(p: number) {
    setPage(p);
    queryClient.invalidateQueries({ queryKey: ['appointments', p] });
  }

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
                {['#', 'Patient', ...(showDoctor ? ['Doctor'] : []), 'Study type', 'Date', 'Status', ''].map((h) => (
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
                  showDoctor={showDoctor}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  onComplete={(id) => completeMutation.mutate(id)}
                  onEmitResult={setResultAppointment}
                />
              ))}
            </tbody>
          </table>
          <div className="border-t py-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      )}

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
