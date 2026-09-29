import type { Metadata } from "next";
import { Collections } from "@/components/func/collections";
import { getFunctionPosts } from "@/lib/func/posts";
export const metadata: Metadata = {
  title: "Collections",
  description: "Build an ordered reading packet from the blog archive.",
  alternates: { canonical: "/func/collections" },
};
export default function CollectionsPage() {
  return (
    <>
      <p className="func-kicker">Reading lists</p>
      <h1>New collection</h1>
      <p className="func-intro">
        Choose posts, arrange your reading order, and prepare a packet to keep.
      </p>
      <Collections posts={getFunctionPosts()} />
    </>
  );
}
