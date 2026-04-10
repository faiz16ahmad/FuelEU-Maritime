import { Router, Request, Response, NextFunction } from 'express';
import { getBankingRecords, bankSurplus, applyBanked } from '../../../composition/container';

export const bankingRouter = Router();

// GET /banking/records?shipId&year → get all bank entries
bankingRouter.get('/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipId, year } = req.query;

    if (!shipId || !year) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'shipId and year are required',
          type: 'ValidationError',
        },
      });
    }

    const records = await getBankingRecords.execute({
      shipId: shipId as string,
      year: parseInt(year as string),
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
});

// POST /banking/bank → bank positive CB
bankingRouter.post('/bank', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipId, year, cb } = req.body;

    if (!shipId || !year || cb === undefined) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'shipId, year, and cb are required',
          type: 'ValidationError',
        },
      });
    }

    const entry = await bankSurplus.execute({
      shipId,
      year: parseInt(year),
      cb: parseFloat(cb),
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// POST /banking/apply → apply banked surplus to deficit
bankingRouter.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipId, year, amount } = req.body;

    if (!shipId || !year || amount === undefined) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'shipId, year, and amount are required',
          type: 'ValidationError',
        },
      });
    }

    const result = await applyBanked.execute({
      shipId,
      year: parseInt(year),
      amount: parseFloat(amount),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});