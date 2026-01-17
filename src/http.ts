import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from "express";
import { AppError } from "./errors";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => { void fn(req, res, next).catch(next); };
}

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "INTERNAL_ERROR" });
};
