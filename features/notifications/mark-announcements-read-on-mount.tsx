"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markAnnouncementsRead } from "./actions";

export function MarkAnnouncementsReadOnMount() {
  const router = useRouter();

  useEffect(() => {
    markAnnouncementsRead().then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}