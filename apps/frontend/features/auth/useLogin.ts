import { useMutation } from "@tanstack/react-query";
import { LoginInput } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";
import { useAuthStore, AuthUser } from "../../store/authStore";

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => setSession(data),
  });
}
