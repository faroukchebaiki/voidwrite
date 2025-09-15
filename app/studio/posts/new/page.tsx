import { auth } from "@/auth-app";
import NewPostClient from "@/components/NewPostClient";

export default async function NewPostPage() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  return <NewPostClient role={role} />;
}
