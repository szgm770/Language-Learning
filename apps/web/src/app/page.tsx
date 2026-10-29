"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Landing } from "@/components/Landing";
import { currentCourse } from "@/lib/progress";
import { useLearner } from "@/lib/store";

/** New visitors see the landing page; people who already learn go straight to their dashboard. */
export default function Index() {
  const { state, loaded } = useLearner();
  const router = useRouter();
  const enrolled = loaded && currentCourse(state) !== undefined;
  useEffect(() => {
    if (enrolled) router.replace("/learn/");
  }, [enrolled, router]);
  return <Landing />;
}
