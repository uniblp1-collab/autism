"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /parent сам по себе — не отдельный экран, а вход в раздел (TASK_PATCH_3 §4): по умолчанию
// ведёт на список детей, самую частую первую остановку родителя после логина.
export default function ParentHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/parent/children");
  }, [router]);

  return null;
}
