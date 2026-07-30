"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEMO_CHILD_ID } from "../api/demoData";

/**
 * Заглушка для офлайн-демо (TASK_DEMO_OFFLINE.md §4): экраны родителя/админа/входа в демо
 * не нужны — они мгновенно уводят на экран ребёнка. Рендерится вместо этих страниц, когда
 * NEXT_PUBLIC_DEMO_MODE=true (проверка — на стороне вызывающего, здесь редирект безусловный).
 */
export function DemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/kid/${DEMO_CHILD_ID}`);
  }, [router]);
  return null;
}
