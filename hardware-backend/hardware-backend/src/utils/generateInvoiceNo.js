/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {'purchase'|'sale'} entity
 * @param {string} prefix e.g. "PUR" or "INV"
 */
export async function generateDocumentNumber(tx, entity, prefix) {
  const year = new Date().getFullYear();
  const model = entity === 'purchase' ? tx.purchase : tx.sale;

  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const count = await model.count({
    where: { createdAt: { gte: startOfYear } },
  });

  const nextSeq = String(count + 1).padStart(6, '0');
  return `${prefix}-${year}-${nextSeq}`;
}
