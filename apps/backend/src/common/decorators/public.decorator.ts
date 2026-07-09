import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Помечает контроллер/хендлер как не требующий JWT-авторизации (например, login/register). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
