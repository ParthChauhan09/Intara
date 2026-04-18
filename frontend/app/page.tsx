"use client";

import { useEffect } from "react";
import { useProtectedRoute } from "@/lib/useProtectedRoute";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { HeroSection, ComplaintForm, ComplaintList } from "@/components/complaints";

function Home() {
  const { auth, complaints } = useMainContext();
  const { isReady, isAllowed } = useProtectedRoute("/sign-in");

  useEffect(() => {
    if (auth.accessToken) {
      complaints.fetchComplaints(auth.accessToken);
    }
  }, [auth.accessToken, complaints]);

  if (!isReady) return <FullPageLoader label="Checking session..." />;
  if (!isAllowed) return <FullPageLoader label="Redirecting..." />;

  const handleCreateComplaint = async (description: string) => {
    if (!auth.accessToken) {
      throw new Error("You must be signed in to submit a complaint.");
    }
    return await complaints.createComplaint(auth.accessToken, { description });
  };

  return (
    <PageContainer>
      <HeroSection />
      <ComplaintForm
        onSubmit={handleCreateComplaint}
        isSubmitting={complaints.isCreating}
      />
      <ComplaintList complaints={complaints.complaints} />
    </PageContainer>
  );
}

export default observer(Home);
