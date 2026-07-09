"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@autism-connect/ui";
import { useRegister } from "../../../features/auth/useRegister";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await register.mutateAsync({ email, password });
    router.replace("/children");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Регистрация родителя</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Пароль (минимум 8 символов)"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {register.isError ? <p className="text-sm text-red-600">{(register.error as Error).message}</p> : null}
        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? "Создаём аккаунт..." : "Зарегистрироваться"}
        </Button>
      </form>
      <p className="text-sm">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="underline">
          Войти
        </Link>
      </p>
    </main>
  );
}
