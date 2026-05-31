import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  studyTypesService,
  type StudyTypePayload,
} from '@/services/studyTypesService';
import { useAuthStore } from '@/store/authStore';
import type { StudyType } from '@/types/appointment';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, 'Min 5 minutes'),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function StudyTypeForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: StudyType;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          duration: initial.duration,
          address: initial.address ?? '',
        }
      : { duration: 30 },
  });

  const mutation = useMutation({
    mutationFn: (data: StudyTypePayload) =>
      initial
        ? studyTypesService.update(initial.id, data)
        : studyTypesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-types'] });
      onSuccess();
    },
    onError: () =>
      setError('root', {
        message: 'Operation failed. Name may already exist.',
      }),
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4"
    >
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ecografía abdominal"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register('description')}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="duration">Duration (min)</Label>
        <Input id="duration" type="number" min={5} {...register('duration')} />
        {errors.duration && (
          <p className="text-xs text-destructive">{errors.duration.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="Clínica del Valle, Av. Simón López Nro. 512"
        />
      </div>

      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initial ? 'Save changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export function StudyTypesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const canCreate = isAdmin || isDoctor;
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyType | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['study-types', page],
    queryFn: () => studyTypesService.getAll(page),
  });

  const studyTypes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: studyTypesService.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['study-types'] }),
  });

  function handlePageChange(p: number) {
    setPage(p);
    queryClient.invalidateQueries({ queryKey: ['study-types', p] });
  }

  function canDelete(st: StudyType): boolean {
    if (isAdmin) return true;
    if (isDoctor) return st.createdById === user?.id;
    return false;
  }

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(st: StudyType) {
    setEditing(st);
    setDialogOpen(true);
  }

  const showActionsColumn = isAdmin || isDoctor;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Types</h1>
          <p className="text-muted-foreground">
            Catalog of available medical studies
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            New study type
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : studyTypes.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No study types yet.
        </p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {[
                  'Name',
                  'Description',
                  'Address',
                  'Duration',
                  ...(showActionsColumn ? [''] : []),
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 pr-4 text-left text-xs font-medium text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studyTypes.map((st) => (
                <tr key={st.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-sm font-medium">{st.name}</td>
                  <td className="py-3 pr-4 text-sm text-muted-foreground">
                    {st.description ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-sm text-muted-foreground">
                    {st.address ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-sm">{st.duration} min</td>
                  {showActionsColumn && (
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(st)}
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDelete(st) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(st.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t py-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit study type' : 'New study type'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the study type details.'
                : 'Add a new study type to the catalog.'}
            </DialogDescription>
          </DialogHeader>
          <StudyTypeForm
            initial={editing}
            onSuccess={() => setDialogOpen(false)}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
