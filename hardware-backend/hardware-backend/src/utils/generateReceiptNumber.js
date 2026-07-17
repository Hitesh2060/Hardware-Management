
export async function generateReceiptNumber(tx, prefix = 'RCPT') {
  const year = new Date().getFullYear();
  
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const count = await tx.payment.count({
    where: { 
      createdAt: { gte: startOfYear },
      direction: 'IN' // Only customer payments
    },
  });

  const nextSeq = count + 1;
  return `${prefix}-${year}-${nextSeq}`; 
}