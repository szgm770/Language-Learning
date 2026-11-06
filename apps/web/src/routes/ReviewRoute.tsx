"use client";

import { useEffect, useMemo, useState } from "react";
import { ReviewPlayer, type ReviewMode } from "@/components/ReviewPlayer";
import { LoadError, Loading } from "@/components/ui";
import { exerciseContext, lexemeIndex, loadCourse, useLoad } from "@/lib/content";
import { useLearner } from "@/lib/store";

export function ReviewRoute({ courseId }: { courseId: string }) {
  const { loaded } = useLearner();
  const [mode, setMode] = useState<ReviewMode | null>(null);
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    setMode(m === "weak" || m === "quick" ? m : "due");
  }, []);
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  const lexemes = useMemo(() => (data ? lexemeIndex(data.units) : new Map()), [data]);
  if (error) return <LoadError />;
  if (!data || !loaded || !mode) return <Loading />;
  return (
    <ReviewPlayer
      courseId={courseId}
      mode={mode}
      lexemes={lexemes}
      ctx={exerciseContext(data)}
    />
  );
}
