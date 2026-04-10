import { DomainError } from './DomainError';

export { DomainError };

export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT';
  constructor(message: string) {
    super(message);
  }
}

export class InsufficientBalanceError extends DomainError {
  readonly code = 'INSUFFICIENT_BALANCE';
  constructor(message: string) {
    super(message);
  }
}

export class InvalidPoolError extends DomainError {
  readonly code = 'INVALID_POOL';
  constructor(message: string) {
    super(message);
  }
}

export class ResourceNotFoundError extends DomainError {
  readonly code = 'RESOURCE_NOT_FOUND';
  constructor(message: string) {
    super(message);
  }
}
