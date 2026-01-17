import type { ErrorRequestHandler } from "express";
import { AppError } from "../domain/errors";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "INTERNAL_ERROR" });
};
