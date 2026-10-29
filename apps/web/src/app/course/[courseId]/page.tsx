import { courseParams } from "@/lib/static-params";
import { CourseRoute } from "@/routes/CourseRoute";

export const dynamicParams = false;
export const generateStaticParams = courseParams;

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseRoute courseId={courseId} />;
}
