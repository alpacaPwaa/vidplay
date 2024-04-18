"use client";

import { trpc } from "@/app/_trpc/client";
import { useRouter } from "next/navigation";

const Template = () => {
  const router = useRouter();

  const { mutate: createFile } = trpc.createFile.useMutation({
    onSuccess: (file) => {
      router.push(`/dashboard/${file.id}`);
    },
  });

  const handleClickTemplate1 = async () => {
    try {
      // Call the trpc method to create a file
      createFile({ name: "Template 1", fileTemplate: "TEMPLATE1" });
    } catch (error) {
      console.error("Error creating file:", error);
    }
  };

  const handleClickTemplate2 = async () => {
    try {
      // Call the trpc method to create a file
      createFile({ name: "Template 2", fileTemplate: "TEMPLATE2" });
    } catch (error) {
      console.error("Error creating file:", error);
    }
  };

  return (
    <main className="mx-auto max-w-7xl md:p-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="mb-3 font-bold text-gray-900 text-2xl">Templates</h1>
      </div>

      {/* display all user templates */}
      <ul className="mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-5">
        <li>
          <div
            className="flex flex-col gap-2 rounded-lg bg-white shadow transition hover:shadow-lg cursor-pointer"
            onClick={handleClickTemplate1}
          >
            <div className="py-20 px-6 flex w-full items-center justify-center space-x-6"></div>
          </div>
          <div className="mt-2 font-semibold">Template 1</div>
        </li>

        <li>
          <div
            className="flex flex-col gap-2 rounded-lg bg-white shadow transition hover:shadow-lg cursor-pointer"
            onClick={handleClickTemplate2}
          >
            <div className="py-20 px-6 flex w-full items-center justify-center space-x-6"></div>
          </div>
          <div className="mt-2 font-semibold">Template 2</div>
        </li>
      </ul>
    </main>
  );
};

export default Template;
