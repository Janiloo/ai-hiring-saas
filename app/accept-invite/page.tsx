import type { Metadata } from "next";
import { getInvitationByToken } from "@/lib/queries/invitations";
import AcceptInviteClient from "@/components/invitations/AcceptInviteClient";
import Link from "next/link";

export const metadata: Metadata = { title: "Accept Invitation — Autome" };

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">
          ✕
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Invalid Link</h1>
        <p className="text-sm text-gray-500">
          This invitation link is missing the required token. Please use the
          link from your invitation email.
        </p>
        <Link href="/login" className="mt-2 text-sm text-indigo-600 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  // Token lookup uses a SECURITY DEFINER function — works for unauthenticated users
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">
          ✕
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Invitation Not Found</h1>
        <p className="text-sm text-gray-500">
          This invitation link is invalid or has already been used. Please ask
          your admin for a new invitation.
        </p>
        <Link href="/login" className="mt-2 text-sm text-indigo-600 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return <AcceptInviteClient invitation={invitation} token={token} />;
}
