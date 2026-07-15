/**
 * Generates a human-readable, sequential, year-scoped document number, e.g.
 *   PUR-2026-000001, INV-2026-000042
 *
 * IMPORTANT: this must be called from *inside* the same DB transaction that
 * creates the parent record, using `tx` (the transaction client) — never the
 * plain prisma client — otherwise two concurrent requests can read the same
 * "last number" and collide. The unique constraint on invoiceNo is the final
 * safety net; on a rare race, the caller should retry once.
 *
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
