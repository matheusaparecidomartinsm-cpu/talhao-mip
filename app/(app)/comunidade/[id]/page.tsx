import { getPost, listPosts } from "@/lib/data";
import { PostView } from "./view";

export async function generateStaticParams() {
  if (process.env.SUPABASE_SECRET_KEY) return [];   // com banco: renderiza sob demanda
  return (await listPosts()).map((p) => ({ id: p.id }));
}
export const dynamicParams = true;
export const revalidate = 30;

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  return <PostView id={id} seed={post ?? null} />;
}
