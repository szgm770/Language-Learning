import { lessonParams } from "@/lib/static-params";
import { LessonRoute } from "@/routes/LessonRoute";

export const dynamicParams = false;
export const generateStaticParams = lessonParams;

export default async function Page({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = await params;
  return <LessonRoute courseId={courseId} lessonId={lessonId} />;
}
