import { auth } from "@/auth-app";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (role !== "admin") {
    redirect("/studio");
  }
  return <div>Members (coming soon)</div>;
}
