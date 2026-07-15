import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

export function SettingsPage() {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<PasswordForm>();

  async function onSubmit(data: PasswordForm) {
    try {
      await api.post('/profile/me/change-password', data);
      toast.success('Password changed — please log in again');
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">Role</span>
            <span className="font-medium">{user?.role}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" {...register('currentPassword', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" {...register('newPassword', { required: true, minLength: 8 })} />
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
