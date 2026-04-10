import { Request, Response, NextFunction } from 'express';
import { 
  DomainError, 
  InvalidInputError, 
  ResourceNotFoundError, 
  InsufficientBalanceError, 
  InvalidPoolError 
} from '@core/domain/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  // Handle domain errors with specific HTTP status codes
  if (error instanceof DomainError) {
    let statusCode: number;

    switch (error.constructor) {
      case InvalidInputError:
        statusCode = 400; // Bad Request
        break;
      case ResourceNotFoundError:
        statusCode = 404; // Not Found
        break;
      case InsufficientBalanceError:
      case InvalidPoolError:
        statusCode = 422; // Unprocessable Entity
        break;
      default:
        statusCode = 500; // Internal Server Error
        break;
    }

    res.status(statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        type: error.constructor.name,
      },
    });
    return;
  }

  // Handle validation errors (e.g., from express-validator)
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        type: 'ValidationError',
      },
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      type: 'InternalServerError',
    },
  });
}