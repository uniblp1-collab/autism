"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@autism-connect/ui";
import { useLogin } from "../../../features/auth/useLogin";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await login.mutateAsync({ email, password });
    router.replace("/children");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-medium">Вход</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Пароль"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {login.isError ? <p className="text-sm text-red-600">{(login.error as Error).message}</p> : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Входим..." : "Войти"}
        </Button>
      </form>
      <p className="text-sm">
        Нет аккаунта?{" "}
        <Link href="/register" className="underline">
          Зарегистрироваться
        </Link>
      </p>
    </main>
  );
}
