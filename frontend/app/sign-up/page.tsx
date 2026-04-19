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
  const { isAllowed } = useGuestOnlyRoute("/");

  // isReady is guaranteed by the global loader in MainContext
  if (!isAllowed) return <FullPageLoader />;

  const handleSubmit = async (name: string, email: string, password: string) => {
    await auth.signUp(name, email, password);
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Fill in your details below to get started."
    >
      <SignUpForm onSubmit={handleSubmit} isSubmitting={auth.isLoading} />
    </AuthLayout>
  );
}

export default observer(SignUpPage);
