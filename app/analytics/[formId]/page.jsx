import AnalyticsPage from "@/components/AnalyticsPage";

export default async function Page({ params }) {
  const { formId } = await params;
  return <AnalyticsPage formId={formId} />;
}
