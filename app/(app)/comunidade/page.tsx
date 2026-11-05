import type { Metadata } from "next";
import { AppBar, Page } from "@/components/shell";
import { listPosts } from "@/lib/data";
import { Feed } from "./feed";

export const metadata: Metadata = { title: "Comunidade" };

export default async function Community() {
  const posts = await listPosts("soja");
  return (
    <>
      <AppBar title="Comunidade" />
      <Page><Feed posts={posts} /></Page>
    </>
  );
}
