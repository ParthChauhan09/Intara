"use client";

import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { useMainContext } from "@/lib/state/MainContext";
import { useGuestOnlyRoute } from "@/lib/useGuestOnlyRoute";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignInForm } from "@/components/auth/SignInForm";
import { FullPageLoader } from "@/components/FullPageLoader";

function SignInPage() {
  const router = useRouter();
  const { auth } = useMainContext();
  const { isAllowed } = useGuestOnlyRoute("/");

  // isReady is guaranteed by the global loader in MainContext
  if (!isAllowed) return <FullPageLoader />;

  const handleSubmit = async (email: string, password: string) => {
    await auth.signIn(email, password);

    const user: any = auth.user;
    const role = user?.user_metadata?.role;

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "operator") {
      router.push("/operator");
    } else {
      router.push("/");
    }

    router.refresh();
  };

  return (
    <AuthLayout
      title="Sign in to continue"
      subtitle="Enter your email and password to access your account."
    >
      <SignInForm onSubmit={handleSubmit} isSubmitting={auth.isLoading} />
    </AuthLayout>
  );
}

export default observer(SignInPage);
