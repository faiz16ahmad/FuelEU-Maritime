import { Router, Request, Response, NextFunction } from 'express';
import { computeComparison } from '../../../composition/container';

export const comparisonRouter = Router();

// GET /routes/comparison → baseline vs others
comparisonRouter.get('/comparison', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await computeComparison.execute();
    res.json(result);
  } catch (error) {
    next(error);
  }
});