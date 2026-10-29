import { courseParams } from "@/lib/static-params";
import { PlacementRoute } from "@/routes/PlacementRoute";

export const dynamicParams = false;
export const generateStaticParams = courseParams;

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <PlacementRoute courseId={courseId} />;
}
