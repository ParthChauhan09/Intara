"use client";

import { useRouter } from "next/navigation";
import { useMainContext } from "@/lib/state/MainContext";
import { observer } from "mobx-react-lite";

function LogoutButton() {
  const { auth } = useMainContext();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.replace("/sign-in");
  };

  return (
    <button
      onClick={handleLogout}
      disabled={auth.isLoading}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      {auth.isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}

export default observer(LogoutButton);
