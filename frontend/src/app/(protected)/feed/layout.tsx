import { redirect } from "next/navigation";
import { headers } from "next/headers";

import AuthHydrator from "@/components/auth/auth-hydrator";
import { FeedProviders } from "@/components/feed/feed-providers";
import { resolveSession } from "@/lib/auth";

export default async function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await resolveSession();

  if (!session.user) {
    const header = await headers();
    const pathname = header.get("x-pathname") || "/feed";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return (
    <FeedProviders>
      <AuthHydrator
        user={session.user}
        needsCookieSync={session.needsCookieSync}
      />
      {children}
    </FeedProviders>
  );
}
