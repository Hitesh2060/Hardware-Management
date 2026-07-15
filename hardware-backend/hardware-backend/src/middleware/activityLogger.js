import prisma from '../config/database.js';

/**
 * Fire-and-forget audit log writer. Wraps a controller action with a record
 * in ActivityLog. Never throws — a logging failure must not fail the
 * business request.
 *
 * Usage: router.post('/', authenticate, logActivity('Product', 'CREATE'), controller)
 * Place BEFORE the controller; it logs intent. For logging the *result*
 * (e.g. the created entity id), call logActivityNow() directly inside the
 * service/controller instead — see productController.js for an example.
 */
export const logActivity = (module, action) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) return; // only log successful mutations
    logActivityNow({
      userId: req.user?.id,
      module,
      action,
      entityId: req.params.id || res.locals.createdId,
      ipAddress: req.ip,
      metadata: { method: req.method, path: req.originalUrl },
    });
  });
  next();
};

export async function logActivityNow({ userId, module, action, entityId, ipAddress, metadata }) {
  try {
    await prisma.activityLog.create({
      data: { userId, module, action, entityId, ipAddress, metadata },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[ActivityLog] failed to write log:', err.message);
  }
}
