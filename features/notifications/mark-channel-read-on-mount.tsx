"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markChannelRead } from "./actions";

export function MarkChannelReadOnMount({ channelId }: { channelId: string }) {
  const router = useRouter();

  useEffect(() => {
    markChannelRead(channelId).then(() => router.refresh());
  }, [channelId, router]);

  return null;
}