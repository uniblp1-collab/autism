import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { runWithRequestId } from "./request-context";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("x-request-id", requestId);
    runWithRequestId(requestId, next);
  }
}
