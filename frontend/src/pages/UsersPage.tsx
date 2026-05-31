import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
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
import { usersService, type AppUser } from '@/services/usersService';
import { useAuthStore } from '@/store/authStore';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ROLES = ['patient', 'doctor', 'admin'] as const;

const createSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  phone: z.string().optional(),
  role: z.enum(ROLES).default('patient'),
});

const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.email('Invalid email'),
  phone: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues   = z.infer<typeof editSchema>;

// ─── UserForm ─────────────────────────────────────────────────────────────────

function UserForm({
  initial,
  isAdmin,
  onSuccess,
  onCancel,
}: {
  initial?: AppUser;
  isAdmin: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!initial;
  const queryKey = isAdmin ? 'users' : 'patients';

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: initial
      ? { fullName: initial.fullName, email: initial.email, phone: initial.phone ?? '' }
      : { fullName: '', email: '', password: '', phone: '', role: 'patient' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateValues | EditValues) => {
      if (isEdit) {
        const d = data as EditValues;
        return usersService.update(initial!.id, { ...d, phone: d.phone || null });
      }
      const d = data as CreateValues;
      return usersService.create({ ...d, phone: d.phone || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      onSuccess();
    },
    onError: () =>
      setError('root', {
        message: isEdit
          ? 'Update failed. Email may already be in use.'
          : 'Could not create user. Email may already exist.',
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
        <>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {'password' in errors && errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={(field.value as string) ?? 'patient'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </>
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
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  admin:   'destructive',
  doctor:  'default',
  patient: 'secondary',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={ROLE_VARIANTS[role] ?? 'secondary'} className="capitalize">
      {role}
    </Badge>
  );
}

// ─── UsersPage ────────────────────────────────────────────────────────────────

export function UsersPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'patient') return <Navigate to="/dashboard" replace />;

  const isAdmin  = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | undefined>();

  const queryKey = isAdmin ? ['users', page] : ['patients', page];
  const fetcher  = isAdmin
    ? () => usersService.findAll(page)
    : () => usersService.findPatients(page);

  const { data, isLoading } = useQuery({ queryKey, queryFn: fetcher });

  const users      = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: usersService.softDelete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [isAdmin ? 'users' : 'patients'] }),
  });

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(u: AppUser) {
    setEditing(u);
    setDialogOpen(true);
  }

  const pageTitle = isAdmin ? 'Users' : 'Patients';

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'All system users' : 'Registered patient records'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            New user
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No users found.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {[
                  'HC',
                  'Full Name',
                  'Email',
                  ...(isAdmin ? ['Role'] : []),
                  'Phone',
                  'Joined',
                  ...(isAdmin ? [''] : []),
                ].map((h) => (
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
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 [&>td]:transition-all [&>td]:duration-150 hover:[&>td]:py-4 hover:[&>td]:bg-muted/50"
                >
                  <td className="py-3 px-4 text-sm font-mono font-medium">
                    {u.role === 'patient' ? (
                      <Link
                        to={`/clinical-history?code=${u.code}`}
                        className="underline hover:text-muted-foreground transition-colors"
                      >
                        HC-{u.code}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">HC-{u.code}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{u.fullName}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{u.email}</td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm text-muted-foreground">{u.phone ?? '—'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(u.id)}
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
            <DialogTitle>{editing ? 'Edit user' : 'New user'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the user details.' : 'Create a new system user.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            initial={editing}
            isAdmin={isAdmin}
            onSuccess={() => setDialogOpen(false)}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
