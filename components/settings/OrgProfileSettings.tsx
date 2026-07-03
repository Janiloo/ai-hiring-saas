"use client";

import { useActionState, useRef, useState } from "react";
import { updateOrgName, uploadOrgLogo, type ActionState } from "@/lib/actions/org-settings";
import { useRouter } from "next/navigation";

interface OrgProfileSettingsProps {
  orgName: string;
  logoUrl: string | null;
  isAdmin: boolean;
}

export default function OrgProfileSettings({
  orgName,
  logoUrl,
  isAdmin,
}: OrgProfileSettingsProps) {
  const router = useRouter();

  // ── Name editing ──────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [nameState, nameAction, namePending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await updateOrgName(prev, formData);
      if (result && "success" in result) {
        setEditing(false);
        router.refresh();
      }
      return result;
    },
    null
  );

  // ── Logo upload ───────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoState, logoAction, logoPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await uploadOrgLogo(prev, formData);
      if (result && "success" in result) {
        router.refresh();
      }
      return result;
    },
    null
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    const form = e.target.closest("form");
    if (form) form.requestSubmit();
  }

  const displayLogo = logoPreview ?? logoUrl;
  const initial = orgName[0]?.toUpperCase() ?? "O";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-5">
        {/* Logo */}
        <div className="relative shrink-0">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt={orgName}
              className="h-16 w-16 rounded-xl border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-bold text-white">
              {initial}
            </div>
          )}
          {isAdmin && (
            <form action={logoAction}>
              <input
                ref={fileRef}
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={logoPending}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow transition hover:bg-indigo-700 disabled:opacity-60"
                title="Change logo"
              >
                {logoPending ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <form action={nameAction} className="flex items-center gap-2">
              <input
                name="org_name"
                defaultValue={orgName}
                required
                maxLength={100}
                autoFocus
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={namePending}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {namePending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{orgName}</h3>
              {isAdmin && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  title="Edit organization name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <p className="mt-0.5 text-xs text-gray-500">
            {isAdmin
              ? "Manage your organization's profile, logo, and display name."
              : "Your organization's profile. Contact an admin to make changes."}
          </p>
        </div>
      </div>

      {/* Feedback messages */}
      {nameState && "error" in nameState && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {nameState.error}
        </div>
      )}
      {nameState && "success" in nameState && (
        <div className="mt-4 rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm text-green-600">
          {nameState.success}
        </div>
      )}
      {logoState && "error" in logoState && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {logoState.error}
        </div>
      )}
      {logoState && "success" in logoState && (
        <div className="mt-4 rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm text-green-600">
          {logoState.success}
        </div>
      )}
    </div>
  );
}
