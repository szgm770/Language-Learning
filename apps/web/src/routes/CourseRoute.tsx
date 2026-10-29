"use client";

import { AppShell } from "@/components/AppShell";
import { CoursePath } from "@/components/CoursePath";
import { LoadError, Loading } from "@/components/ui";
import { loadCourse, useLoad } from "@/lib/content";
import { useLearner } from "@/lib/store";

export function CourseRoute({ courseId }: { courseId: string }) {
  const { loaded } = useLearner();
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  if (error) return <LoadError />;
  if (!data || !loaded) return <Loading />;
  return (
    <AppShell>
      <CoursePath courseId={courseId} manifest={data.manifest} units={data.units} />
    </AppShell>
  );
}
