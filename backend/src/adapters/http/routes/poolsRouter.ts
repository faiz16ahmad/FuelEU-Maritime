import { Router, Request, Response, NextFunction } from 'express';
import { createPool } from '../../../composition/container';

export const poolsRouter = Router();

// POST /pools → create pool with greedy allocation
poolsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipIds, year } = req.body;

    if (!shipIds || !Array.isArray(shipIds) || !year) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'shipIds (array) and year are required',
          type: 'ValidationError',
        },
      });
    }

    if (shipIds.length < 2) {
      return res.status(400).json({
        error: {
          code: 'INVALID_POOL_SIZE',
          message: 'A pool requires at least two members',
          type: 'ValidationError',
        },
      });
    }

    const pool = await createPool.execute({
      shipIds,
      year: parseInt(year),
    });

    res.status(201).json(pool);
  } catch (error) {
    next(error);
  }
});