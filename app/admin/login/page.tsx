import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { adminConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16">
      <Link href="/" className="self-start text-sm text-neutral-700 hover:underline">
        ← Rolodex
      </Link>
      <div className="mt-16 w-full max-w-sm bg-slate-50 p-6 rounded-md border border-black shadow-md">
        <h1 className="text-2xl font-semibold mb-4">Manage contacts</h1>
        {adminConfigured() ? (
          <LoginForm next={searchParams.next} />
        ) : (
          <p className="text-sm text-neutral-700">
            Admin is not configured. Set <code>ADMIN_PASSWORD</code> and{" "}
            <code>AUTH_SECRET</code> in the environment to enable editing.
          </p>
        )}
      </div>
    </main>
  );
}
