"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/ui";
import { CourseRoute } from "@/routes/CourseRoute";
import { currentCourse } from "@/lib/progress";
import { useLearner } from "@/lib/store";

/** The learning path of the current course. */
export default function PathPage() {
  const { state, loaded } = useLearner();
  const router = useRouter();
  const courseId = loaded ? currentCourse(state) : undefined;
  useEffect(() => {
    if (loaded && !courseId) router.replace("/start/");
  }, [loaded, courseId, router]);
  if (!courseId) return <Loading />;
  return <CourseRoute courseId={courseId} />;
}
