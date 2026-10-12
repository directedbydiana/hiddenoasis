import LoginForm from "@/components/LoginForm";
import { adminConfigured } from "@/lib/auth";
import { card, page } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className={`${page} flex flex-col items-center`}>
      <div className={`${card} mt-10 w-full max-w-sm p-6`}>
        <h1 className="text-xl font-semibold">Sign in to manage</h1>
        <p className="mb-5 mt-1 text-sm text-muted">
          The admin password unlocks the contact list and saving cards to the directory. Anyone can build and download a card without it.
        </p>
        {adminConfigured() ? (
          <LoginForm next={searchParams.next} />
        ) : (
          <p className="text-sm text-muted">
            Admin is not configured. Set <code>ADMIN_PASSWORD</code> and <code>AUTH_SECRET</code> in the environment to enable it.
          </p>
        )}
      </div>
    </main>
  );
}
