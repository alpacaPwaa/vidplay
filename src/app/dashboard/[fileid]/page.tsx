import Template2 from "@/components/templates/Template2";
import Template1 from "@/components/templates/Template1";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: {
    fileid: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { fileid } = params;

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) {
    redirect(`/auth-callback?origin=dashboard/${fileid}`);
  }

  const file = await db.file.findFirst({
    where: {
      id: fileid,
      userId: user.id,
    },
  });

  if (!file) notFound();

  return file.fileTemplate === "TEMPLATE1" ? (
    <Template1 fileId={fileid} />
  ) : (
    <Template2 />
  );
};

export default Page;
