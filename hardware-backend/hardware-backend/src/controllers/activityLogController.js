import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import prisma from '../config/database.js';

export const listActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, module, userId } = req.query;
  const where = {
    ...(module ? { module } : {}),
    ...(userId ? { userId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.status(200).json(new ApiResponse(200, { items, pagination: { page: Number(page), limit: Number(limit), total } }));
});
