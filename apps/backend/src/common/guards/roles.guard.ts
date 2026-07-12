import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { CurrentUserPayload } from "../decorators/current-user.decorator";
import { UserRole } from "../../modules/auth/domain/user.entity";
import { ForbiddenDomainException } from "../exceptions/domain.exception";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    const role = request.user?.role;
    if (!role || !requiredRoles.includes(role as UserRole)) {
      throw new ForbiddenDomainException("Недостаточно прав для выполнения действия");
    }

    return true;
  }
}
