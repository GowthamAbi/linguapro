import type { NextFunction, Request, Response } from "express";

type AsyncController = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(controller: AsyncController) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(controller(request, response, next)).catch(next);
  };
}