import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appointmentsService } from '@/services/appointmentsService';
import { studyTypesService } from '@/services/studyTypesService';
import { usersService } from '@/services/usersService';

const schema = z.object({
  patientId: z.string().min(1, 'Required'),
  doctorId: z.string().min(1, 'Required'),
  studyTypeId: z.string().optional(),
  scheduledDate: z.string().min(1, 'Required'),
  duration: z.coerce.number().min(5, 'Min 5 minutes'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
}

export function AppointmentForm({ onSuccess }: Props) {
  const { data: patients = [] } = useQuery({
    queryKey: ['users', 'patients'],
    queryFn: () => usersService.getByRole('patient'),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: () => usersService.getByRole('doctor'),
  });

  const { data: studyTypes = [] } = useQuery({
    queryKey: ['study-types'],
    queryFn: studyTypesService.getAll,
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: appointmentsService.create,
    onSuccess,
    onError: () => setError('root', { message: 'Failed to create appointment' }),
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="patientId">Patient</Label>
        <select
          id="patientId"
          {...register('patientId')}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select patient…</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        {errors.patientId && <p className="text-xs text-destructive">{errors.patientId.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="doctorId">Doctor</Label>
        <select
          id="doctorId"
          {...register('doctorId')}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select doctor…</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.fullName}</option>
          ))}
        </select>
        {errors.doctorId && <p className="text-xs text-destructive">{errors.doctorId.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="studyTypeId">Study type</Label>
        <select
          id="studyTypeId"
          {...register('studyTypeId')}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select study type…</option>
          {studyTypes.map((st) => (
            <option key={st.id} value={st.id}>{st.name} ({st.duration} min)</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="scheduledDate">Date & time</Label>
          <Input id="scheduledDate" type="datetime-local" {...register('scheduledDate')} />
          {errors.scheduledDate && <p className="text-xs text-destructive">{errors.scheduledDate.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="duration">Duration (min)</Label>
          <Input id="duration" type="number" min={5} defaultValue={30} {...register('duration')} />
          {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" placeholder="Reason for visit" {...register('reason')} />
      </div>

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create appointment'}
        </Button>
      </div>
    </form>
  );
}
