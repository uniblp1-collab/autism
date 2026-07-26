"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { DEMO_CHILD_ID, isDemoMode } from "../shared/api/demoData";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Офлайн-демо: без авторизации, сразу на экран ребёнка (TASK_DEMO_OFFLINE.md §4).
    if (isDemoMode) {
      router.replace(`/kid/${DEMO_CHILD_ID}`);
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(user.role === "ADMIN" ? "/admin" : "/parent");
  }, [router, user]);

  return null;
}
