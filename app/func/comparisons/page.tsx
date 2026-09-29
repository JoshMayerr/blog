import type { Metadata } from "next";
import { Comparisons } from "@/components/func/comparisons";
import { getFunctionPosts } from "@/lib/func/posts";
export const metadata: Metadata = {
  title: "Comparisons",
  description: "Compare posts, shared words, and references from the archive.",
  alternates: { canonical: "/func/comparisons" },
};
export default function ComparisonsPage() {
  return (
    <>
      <p className="func-kicker">Research workspace</p>
      <h1>New comparison</h1>
      <p className="func-intro">
        Select posts from the archive and choose what to include in your report.
      </p>
      <Comparisons posts={getFunctionPosts()} />
    </>
  );
}
