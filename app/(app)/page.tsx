import { redirect } from "next/navigation";

export default function Home() {
  redirect("/home");
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Zibuke Africa
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Internal Collaboration Hub
        </p>
      </div>
    </div>
  );
}