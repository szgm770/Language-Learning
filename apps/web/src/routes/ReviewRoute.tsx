"use client";

import { useMemo } from "react";
import { ReviewPlayer } from "@/components/ReviewPlayer";
import { LoadError, Loading } from "@/components/ui";
import { exerciseContext, lexemeIndex, loadCourse, useLoad } from "@/lib/content";
import { useLearner } from "@/lib/store";

export function ReviewRoute({ courseId }: { courseId: string }) {
  const { loaded } = useLearner();
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  const lexemes = useMemo(() => (data ? lexemeIndex(data.units) : new Map()), [data]);
  if (error) return <LoadError />;
  if (!data || !loaded) return <Loading />;
  return (
    <ReviewPlayer
      courseId={courseId}
      lexemes={lexemes}
      ctx={exerciseContext(data)}
    />
  );
}
