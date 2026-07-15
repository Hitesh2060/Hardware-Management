import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface StaffRow {
  staffId: string;
  staffName: string;
  totalSalesAmount: number;
  invoiceCount: number;
  averageSaleValue: number;
}

export function AnalyticsPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);

  useEffect(() => {
    api.get('/staff-performance/sales').then((r) => setStaff(r.data.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Staff performance, last 30 days.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales by Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead className="tabular">Invoices</TableHead>
                <TableHead className="tabular">Total Sales</TableHead>
                <TableHead className="tabular">Avg. Sale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[var(--color-ink-muted)]">
                    No sales recorded in this period.
                  </TableCell>
                </TableRow>
              )}
              {staff.map((s) => (
                <TableRow key={s.staffId}>
                  <TableCell className="font-medium">{s.staffName}</TableCell>
                  <TableCell className="tabular">{s.invoiceCount}</TableCell>
                  <TableCell className="tabular">Rs. {Number(s.totalSalesAmount).toFixed(2)}</TableCell>
                  <TableCell className="tabular">Rs. {Number(s.averageSaleValue).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
