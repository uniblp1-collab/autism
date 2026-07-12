import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../modules/auth/domain/user.entity";

export const ROLES_KEY = "roles";

/** Ограничивает хендлер/контроллер ролями из User.role (проверяется RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
