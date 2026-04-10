import { Router, Request, Response, NextFunction } from 'express';
import { computeCB, getAdjustedCB } from '../../../composition/container';

export const complianceRouter = Router();

// GET /compliance/cb?shipId&year → compute and return CB
complianceRouter.get('/cb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipId, year, ghgIntensity, fuelConsumption } = req.query;

    // Validate required parameters
    if (!shipId || !year || !ghgIntensity || !fuelConsumption) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'shipId, year, ghgIntensity, and fuelConsumption are required',
          type: 'ValidationError',
        },
      });
    }

    const result = await computeCB.execute({
      shipId: shipId as string,
      year: parseInt(year as string),
      ghgIntensity: parseFloat(ghgIntensity as string),
      fuelConsumption: parseFloat(fuelConsumption as string),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /compliance/adjusted-cb?shipId&year → CB after bank applications
complianceRouter.get('/adjusted-cb', async (req: Request, res: Response, next: NextFunction) => {
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

    const result = await getAdjustedCB.execute({
      shipId: shipId as string,
      year: parseInt(year as string),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});