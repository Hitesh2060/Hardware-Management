import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';

interface PartyBase {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  outstandingBalance?: number;
}

interface PartyForm {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  openingBalance?: number;
}

export function PartyListPage<T extends PartyBase>({
  title,
  description,
  createLabel,
  showCreditLimit = false,
  showLedger = false,
  api,
  onViewLedger,
}: {
  title: string;
  description: string;
  createLabel: string;
  showCreditLimit?: boolean;
  showLedger?: boolean;
  api: {
    list: (params: { search?: string; limit?: number }) => Promise<{ items: T[] }>;
    create: (data: PartyForm) => Promise<T>;
  };
  onViewLedger?: (party: T) => void;
}) {
  const [parties, setParties] = useState<T[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<PartyForm>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.list({ search, limit: 50 });
      setParties(result.items);
    } finally {
      setLoading(false);
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function onSubmit(data: PartyForm) {
    try {
      await api.create({
        ...data,
        creditLimit: data.creditLimit ? Number(data.creditLimit) : undefined,
        openingBalance: data.openingBalance ? Number(data.openingBalance) : undefined,
      });
      toast.success(`${title.slice(0, -1)} created`);
      setDialogOpen(false);
      reset();
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">{description}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> {createLabel}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createLabel}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input {...register('name', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...register('phone')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input {...register('address')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {showCreditLimit && (
                  <div className="space-y-1.5">
                    <Label>Credit Limit</Label>
                    <Input type="number" step="0.01" {...register('creditLimit')} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Opening Balance</Label>
                  <Input type="number" step="0.01" {...register('openingBalance')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="tabular">Outstanding</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[var(--color-ink-muted)]">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!loading && parties.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[var(--color-ink-muted)]">
                No records found.
              </TableCell>
            </TableRow>
          )}
          {parties.map((party) => (
            <TableRow key={party.id}>
              <TableCell className="font-medium">{party.name}</TableCell>
              <TableCell>{party.phone || '—'}</TableCell>
              <TableCell>{party.email || '—'}</TableCell>
              <TableCell className="tabular">
                {party.outstandingBalance ? (
                  <Badge variant={party.outstandingBalance > 0 ? 'danger' : 'success'}>
                    Rs. {Number(party.outstandingBalance).toFixed(2)}
                  </Badge>
                ) : (
                  <span className="text-[var(--color-ink-muted)]">Rs. 0.00</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {showLedger && onViewLedger && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewLedger(party)}
                      className="h-8 px-2 text-blue-600"
                      title="View Ledger"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}