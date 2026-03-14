import { useState, useCallback } from "react";
import dotenv from 'dotenv';


interface Props {
  onSuccess?: (accessToken: string) => void;
  onError?: (detail?: string) => void;
  label?: string;
  disabled?: boolean;
  variant?: "login" | "signup";
}

function getGoogleOAuthURL() {
  // Must match EXACTLY one of the Authorized redirect URIs in Google Cloud Console (no trailing slash).
  const origin = window.location.origin.replace(/\/$/, "");
  const redirectUri = `${origin}/auth/google/callback`;


  const GOOGLE_CLIENT_ID =  "502515400049-lb7r6k1qd6lqaqjjdqn0vu8b9ocoing9.apps.googleusercontent.com"
  
  // console.log(GOOGLE_CLIENT_ID);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email profile openid",
    access_type: "offline",
    prompt: "select_account",
  });

  console.log(params)
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function GoogleSignInButton({
  disabled = false,
  variant = "login",
}: Props) {
  const [busy, setBusy] = useState(false);

  const text = variant === "signup" ? "Sign up with Google" : "Continue with Google";

  const handleClick = useCallback(() => {
    if (disabled || busy) return;
    setBusy(true);
    window.location.href = getGoogleOAuthURL();
  }, [disabled, busy]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || disabled}
      className="group relative w-full flex items-center justify-center gap-3 h-[52px] rounded-xl
        border border-slate-200/80 dark:border-slate-700/80
        bg-white dark:bg-slate-900
        text-slate-800 dark:text-slate-100
        font-medium text-[15px] tracking-[-0.01em]
        shadow-sm
        transition-all duration-200 ease-out
        hover:shadow-md hover:shadow-blue-500/[0.08] hover:border-slate-300 dark:hover:border-slate-600
        active:scale-[0.985] active:shadow-sm
        disabled:opacity-60 disabled:pointer-events-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
    >
      <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-500/[0.04] via-transparent to-orange-500/[0.03]" />

      {busy ? (
        <span className="flex h-5 w-5 items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
        </span>
      ) : (
        <svg className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
        </svg>
      )}

      <span className="relative">{busy ? "Redirecting to Google..." : text}</span>
    </button>
  );
}
