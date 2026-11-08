import { listenParams } from "@/lib/static-params";
import { ListenRoute } from "@/routes/ListenRoute";

export const dynamicParams = false;
export const generateStaticParams = listenParams;

export default async function Page({ params }: { params: Promise<{ courseId: string; unitId: string }> }) {
  const { courseId, unitId } = await params;
  return <ListenRoute courseId={courseId} unitId={unitId} />;
}
