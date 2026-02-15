"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";

export default function UserProjectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    router.replace(`/user/projects/${params.id}/overview`);
  }, [params.id, router]);

  return <FitoutLoadingSpinner />;
}