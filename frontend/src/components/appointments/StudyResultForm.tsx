import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { studyResultsService } from '@/services/studyResultsService';
import type { Appointment } from '@/types/appointment';

const schema = z.object({
  findings: z.string().min(10, 'Findings must be at least 10 characters'),
  conclusion: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function StudyResultForm({
  appointment,
  onSuccess,
  onCancel,
}: {
  appointment: Appointment;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      studyResultsService.create({ appointmentId: appointment.id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['study-results'] });
      onSuccess();
    },
    onError: () =>
      setError('root', { message: 'Could not emit result. It may already exist for this appointment.' }),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-muted/40 px-4 py-3 text-sm space-y-1">
        <p><span className="text-muted-foreground">Patient:</span> {appointment.patient.fullName}</p>
        <p><span className="text-muted-foreground">Doctor:</span> {appointment.doctor.fullName}</p>
        {appointment.studyType && (
          <p><span className="text-muted-foreground">Study type:</span> {appointment.studyType.name}</p>
        )}
        <p>
          <span className="text-muted-foreground">Date:</span>{' '}
          {new Date(appointment.scheduledDate).toLocaleString()}
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="findings">Findings</Label>
          <Textarea
            id="findings"
            rows={5}
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
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Emit result'}
          </Button>
        </div>
      </form>
    </div>
  );
}
