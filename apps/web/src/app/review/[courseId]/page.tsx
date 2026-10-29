import { courseParams } from "@/lib/static-params";
import { ReviewRoute } from "@/routes/ReviewRoute";

export const dynamicParams = false;
export const generateStaticParams = courseParams;

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <ReviewRoute courseId={courseId} />;
}
