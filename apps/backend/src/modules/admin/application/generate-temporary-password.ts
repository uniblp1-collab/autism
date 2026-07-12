import { randomInt } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/**
 * TODO(безопасность, MVP-упрощение): временный пароль возвращается напрямую в ответе API
 * (см. reset-user-password.use-case.ts), без отправки по email и без принудительной смены
 * пароля при следующем входе. Это сознательное упрощение для MVP, а не финальный дизайн —
 * для продакшена нужен email-канал восстановления и/или обязательная смена пароля.
 */
export function generateTemporaryPassword(length = 12): string {
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += ALPHABET[randomInt(ALPHABET.length)];
  }
  return password;
}
