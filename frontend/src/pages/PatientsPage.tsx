import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { patientsService, type Patient } from '@/services/patientsService';
import { useAuthStore } from '@/store/authStore';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  phone: z.string().optional(),
});

const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.email('Invalid email'),
  phone: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ─── PatientForm ──────────────────────────────────────────────────────────────

function PatientForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Patient;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: initial
      ? { fullName: initial.fullName, email: initial.email, phone: initial.phone ?? '' }
      : { fullName: '', email: '', password: '', phone: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateValues | EditValues) => {
      if (isEdit) {
        const d = data as EditValues;
        return patientsService.update(initial!.id, { ...d, phone: d.phone || null });
      }
      const d = data as CreateValues;
      return patientsService.create({ ...d, phone: d.phone || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      onSuccess();
    },
    onError: () =>
      setError('root', {
        message: isEdit
          ? 'Update failed. Email may already be in use.'
          : 'Could not create patient. Email may already exist.',
      }),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...register('fullName')} />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {!isEdit && (
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} />
          {'password' in errors && errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" {...register('phone')} placeholder="+591 70000000" />
      </div>

      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create patient'}
        </Button>
      </div>
    </form>
  );
}

// ─── PatientsPage ─────────────────────────────────────────────────────────────

export function PatientsPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'patient') return <Navigate to="/dashboard" replace />;

  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page],
    queryFn: () => patientsService.findAll(page),
  });

  const patients = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: patientsService.softDelete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(p: Patient) {
    setEditing(p);
    setDialogOpen(true);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">Registered patient records</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            New patient
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : patients.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No patients found.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {['HC', 'Full Name', 'Email', 'Phone', 'Joined', ...(isAdmin ? [''] : [])].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-left text-xs font-medium uppercase text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 [&>td]:transition-all [&>td]:duration-150 hover:[&>td]:py-4 hover:[&>td]:bg-muted/50"
                >
                  <td className="py-3 px-4 text-sm font-mono font-medium">
                    <Link
                      to={`/clinical-history?code=${p.code}`}
                      className="underline hover:text-muted-foreground transition-colors"
                    >
                      HC-{p.code}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{p.fullName}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{p.email}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{p.phone ?? '—'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(p.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit patient' : 'New patient'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the patient details.' : 'Register a new patient in the system.'}
            </DialogDescription>
          </DialogHeader>
          <PatientForm
            initial={editing}
            onSuccess={() => setDialogOpen(false)}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
