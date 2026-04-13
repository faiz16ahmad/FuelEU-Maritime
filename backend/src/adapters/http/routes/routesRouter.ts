import { Router, Request, Response, NextFunction } from 'express';
import { routeRepository, setBaseline } from '../../../composition/container';

export const routesRouter = Router();

// GET /routes → all routes
routesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routes = await routeRepository.findAll();
    res.json(routes);
  } catch (error) {
    next(error);
  }
});

// POST /routes/:routeId/baseline → set baseline
routesRouter.post('/:routeId/baseline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { routeId } = req.params;
    
    if (!routeId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_ROUTE_ID',
          message: 'Route ID is required',
          type: 'ValidationError',
        },
      });
    }

    const updatedRoute = await setBaseline.execute({ routeId: routeId as string });
    res.json(updatedRoute);
  } catch (error) {
    next(error);
  }
});