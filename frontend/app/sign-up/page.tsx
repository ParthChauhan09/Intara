"use client";

import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import { useGuestOnlyRoute } from "@/lib/useGuestOnlyRoute";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignUpForm } from "@/components/auth/SignUpForm";

function SignUpPage() {
  const router = useRouter();
  const { auth } = useMainContext();
  const { isReady, isAllowed } = useGuestOnlyRoute("/");

  if (!isReady) {
    return <FullPageLoader label="Loading..." />;
  }

  if (!isAllowed) {
    return <FullPageLoader label="Redirecting..." />;
  }

  const handleSubmit = async (name: string, email: string, password: string) => {
    await auth.signUp(name, email, password);
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="This sign-up page mirrors the default shadcn/ui form layout so it feels familiar when you install the components."
    >
      <SignUpForm
        onSubmit={handleSubmit}
        isSubmitting={auth.isLoading}
      />
    </AuthLayout>
  );
}

export default observer(SignUpPage);
