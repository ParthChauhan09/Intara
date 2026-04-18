"use client";

import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import { useGuestOnlyRoute } from "@/lib/useGuestOnlyRoute";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignInForm } from "@/components/auth/SignInForm";

function SignInPage() {
  const router = useRouter();
  const { auth } = useMainContext();
  const { isReady, isAllowed } = useGuestOnlyRoute("/");

  if (!isReady) {
    return <FullPageLoader label="Loading..." />;
  }

  if (!isAllowed) {
    return <FullPageLoader label="Redirecting..." />;
  }

  const handleSubmit = async (email: string, password: string) => {
    await auth.signIn(email, password);
    router.push("/");
    router.refresh();
  };

  return (
    <AuthLayout
      title="Sign in to continue"
      subtitle="Keep the default shadcn/ui structure and customize the fields or actions later as your auth flow grows."
    >
      <SignInForm
        onSubmit={handleSubmit}
        isSubmitting={auth.isLoading}
      />
    </AuthLayout>
  );
}

export default observer(SignInPage);
