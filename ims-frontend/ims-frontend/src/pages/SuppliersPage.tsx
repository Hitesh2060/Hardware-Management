import { useState } from 'react';
import { PartyListPage } from '@/components/PartyListPage';
import { supplierApi } from '@/api/parties';
import { SupplierLedgerDialog } from '@/components/SupplierLedgerDialog';
import type { Supplier } from '@/types';

export function SuppliersPage() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');
  const [ledgerOpen, setLedgerOpen] = useState(false);

  function handleViewLedger(supplier: Supplier) {
    setSelectedSupplierId(supplier.id);
    setSelectedSupplierName(supplier.name);
    setLedgerOpen(true);
  }

  return (
    <>
      <PartyListPage
        title="Suppliers"
        description="Supplier accounts and amounts owed for received goods."
        createLabel="New Supplier"
        api={supplierApi}
        onViewLedger={handleViewLedger}
        showLedger={true}
      />

      <SupplierLedgerDialog
        open={ledgerOpen}
        onOpenChange={setLedgerOpen}
        supplierId={selectedSupplierId || ''}
        supplierName={selectedSupplierName}
      />
    </>
  );
}