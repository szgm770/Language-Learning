import { courseParams } from "@/lib/static-params";
import { CertificateRoute } from "@/routes/CertificateRoute";

export const dynamicParams = false;
export const generateStaticParams = courseParams;

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CertificateRoute courseId={courseId} />;
}
