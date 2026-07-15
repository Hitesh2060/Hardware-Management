import { useState } from 'react';
import { PartyListPage } from '@/components/PartyListPage';
import { customerApi } from '@/api/parties';
import { CustomerLedgerDialog } from '@/components/CustomerLedgerDialog';
import type { Customer } from '@/types';

export function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [ledgerOpen, setLedgerOpen] = useState(false);

  function handleViewLedger(customer: Customer) {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerName(customer.name);
    setLedgerOpen(true);
  }

  return (
    <>
      <PartyListPage
        title="Customers"
        description="Customer accounts and amounts owed to you."
        createLabel="New Customer"
        api={customerApi}
        onViewLedger={handleViewLedger}
        showLedger={true}
        showCreditLimit={true}
      />

      <CustomerLedgerDialog
        open={ledgerOpen}
        onOpenChange={setLedgerOpen}
        customerId={selectedCustomerId || ''}
        customerName={selectedCustomerName}
      />
    </>
  );
}