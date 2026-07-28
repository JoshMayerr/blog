import { allLearnings } from "contentlayer2/generated";
import { learningSocialImage } from "@/components/learning-social-image";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const essay = allLearnings.find(
    (learning) => learning.slugAsParams === slugPath,
  );

  return learningSocialImage(essay?.title ?? "Learning");
}
