import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { studyResultsService } from '@/services/studyResultsService';
import { appointmentsService } from '@/services/appointmentsService';
import { useAuthStore } from '@/store/authStore';
import type { StudyResult } from '@/types/studyResult';
import type { Appointment } from '@/types/appointment';

const createSchema = z.object({
  appointmentId: z.string().min(1, 'Select an appointment'),
  findings: z.string().min(10, 'Findings must be at least 10 characters'),
  conclusion: z.string().optional(),
});

const updateSchema = z.object({
  findings: z.string().min(10, 'Findings must be at least 10 characters').optional(),
  conclusion: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

function CreateResultForm({
  appointments,
  onSuccess,
  onCancel,
}: {
  appointments: Appointment[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) });

  const mutation = useMutation({
    mutationFn: studyResultsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-results'] });
      onSuccess();
    },
    onError: () =>
      setError('root', { message: 'Could not save result. Appointment may already have one.' }),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="appointmentId">Appointment</Label>
        <Select onValueChange={(v) => setValue('appointmentId', v)}>
          <SelectTrigger id="appointmentId">
            <SelectValue placeholder="Select appointment" />
          </SelectTrigger>
          <SelectContent>
            {appointments.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.patient.fullName} — {new Date(a.scheduledDate).toLocaleDateString()} —{' '}
                {a.studyType?.name ?? 'No study type'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.appointmentId && (
          <p className="text-xs text-destructive">{errors.appointmentId.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="findings">Findings</Label>
        <Textarea
          id="findings"
          rows={4}
          placeholder="Describe clinical findings in detail…"
          {...register('findings')}
        />
        {errors.findings && (
          <p className="text-xs text-destructive">{errors.findings.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="conclusion">Conclusion (optional)</Label>
        <Textarea
          id="conclusion"
          rows={3}
          placeholder="Clinical conclusion and recommendations…"
          {...register('conclusion')}
        />
      </div>

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Create result'}
        </Button>
      </div>
    </form>
  );
}

function EditResultForm({
  result,
  onSuccess,
  onCancel,
}: {
  result: StudyResult;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      findings: result.findings,
      conclusion: result.conclusion ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateFormValues) => studyResultsService.update(result.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-results'] });
      onSuccess();
    },
    onError: () => setError('root', { message: 'Failed to update result.' }),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="findings">Findings</Label>
        <Textarea id="findings" rows={4} {...register('findings')} />
        {errors.findings && (
          <p className="text-xs text-destructive">{errors.findings.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="conclusion">Conclusion (optional)</Label>
        <Textarea id="conclusion" rows={3} {...register('conclusion')} />
      </div>

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

type DialogState = { mode: 'create' } | { mode: 'edit'; result: StudyResult } | null;

export function StudyResultsPage() {
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === 'admin' || user?.role === 'doctor';
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['study-results', page],
    queryFn: () => studyResultsService.getAll({ page }),
  });

  const results = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: () => appointmentsService.getAll({ limit: 100 }),
    enabled: canWrite,
  });

  const scheduledOrCompleted = (appointmentsData?.data ?? []).filter(
    (a) => a.status === 'scheduled' || a.status === 'completed',
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Results</h1>
          <p className="text-muted-foreground">Medical findings and reports</p>
        </div>
        {canWrite && (
          <Button onClick={() => setDialog({ mode: 'create' })} className="gap-2">
            <Plus size={16} />
            New result
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : results.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No study results yet.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full" data-testid="results-table">
            <thead className="border-b bg-muted/50">
              <tr>
                {['Patient', 'Doctor', 'Appt #', 'Study Type', 'Findings', ...(canWrite ? [''] : [])].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b last:border-0 [&>td]:transition-all [&>td]:duration-150 hover:[&>td]:py-4 hover:[&>td]:bg-muted/50">
                  <td className="py-3 px-4 text-sm font-medium">
                    <span>{r.patient.fullName}</span>
                    <span className="ml-1 text-xs text-muted-foreground font-mono">HC-{r.patient.code}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{r.doctor.fullName}</td>
                  <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                    #{r.appointment?.code ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {r.appointment?.studyType?.name ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-sm max-w-xs truncate" title={r.findings}>
                    {r.findings.length > 60 ? `${r.findings.slice(0, 60)}…` : r.findings}
                  </td>
                  {canWrite && (
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDialog({ mode: 'edit', result: r })}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t py-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === 'edit' ? 'Edit study result' : 'New study result'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === 'edit'
                ? 'Update findings or conclusion.'
                : 'Enter the findings for the selected appointment.'}
            </DialogDescription>
          </DialogHeader>

          {dialog?.mode === 'create' && (
            <CreateResultForm
              appointments={scheduledOrCompleted}
              onSuccess={() => setDialog(null)}
              onCancel={() => setDialog(null)}
            />
          )}
          {dialog?.mode === 'edit' && (
            <EditResultForm
              result={dialog.result}
              onSuccess={() => setDialog(null)}
              onCancel={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
