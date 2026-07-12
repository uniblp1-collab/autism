import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { ForbiddenDomainException } from "../exceptions/domain.exception";

function buildContext(user?: { role: string }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("allows the request when the handler declares no @Roles metadata", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext({ role: "PARENT" }))).toBe(true);
  });

  it("allows the request when the current user's role is in the required list", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["ADMIN"]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext({ role: "ADMIN" }))).toBe(true);
  });

  it("throws ForbiddenDomainException when the current user's role is not allowed", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["ADMIN"]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(buildContext({ role: "PARENT" }))).toThrow(ForbiddenDomainException);
  });

  it("throws ForbiddenDomainException when there is no authenticated user on the request", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["ADMIN"]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenDomainException);
  });
});
