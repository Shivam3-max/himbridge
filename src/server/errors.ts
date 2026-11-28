/**
 * An expected, user-facing failure (bad input, not allowed, not found…).
 * Services throw these; actions turn them into `{ ok: false, error }` and route handlers into HTTP responses.
 * Anything else is an unexpected bug: it is logged and the user sees a generic message.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 415 = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const fail = (message: string, status?: AppError['status']): never => {
  throw new AppError(message, status);
};

export const notFound = (what: string) => new AppError(`${what} not found`, 404);
export const forbidden = (message = 'Not allowed for your account type') => new AppError(message, 403);
