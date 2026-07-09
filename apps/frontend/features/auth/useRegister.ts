import { useMutation } from "@tanstack/react-query";
import { RegisterInput } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";
import { useAuthStore, AuthUser } from "../../store/authStore";

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => setSession(data),
  });
}
