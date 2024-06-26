"use client";

import { trpc } from "@/app/_trpc/client";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

interface Template1Props {
  fileId: string;
}

const Template1 = ({ fileId }: Template1Props) => {
  const [promptText, setPromptText] = useState("");
  const [promtError, setPromptError] = useState("");
  const [videoFile, setVideoFile] = useState(
    "./public/templates/template1/video1.mp4"
  );
  const { data: video } = trpc.getFileVideo.useQuery({
    fileId: fileId,
  });
  const { mutate: createVideo, isLoading } = trpc.createVideo.useMutation({
    onSuccess: async () => {
      console.log("File uploaded successfully");
    },
    onError: (error) => {
      console.error("Error creating video:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();

    if (!promptText) {
      setPromptError("Please write a prompt");
      return;
    }

    createVideo({
      fileId: fileId,
      promt: promptText,
      video: videoFile,
    });
  };

  const handleChangePrompt = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
  };

  return (
    <div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
        {/* Left sidebar */}
        <div className="flex-1 xl:flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 bg-zinc-50">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
              <div className="relative flex flex-col space-y-3">
                <label htmlFor="text-area" className="text-md font-medium">
                  Enter a topic
                </label>
                <textarea
                  id="text-area"
                  name="prompt"
                  value={promptText}
                  onChange={handleChangePrompt}
                  className={`w-full rounded-md border ${
                    promtError ? "border-red-500" : "border-gray-300"
                  } p-2 text-gray-800 bg-zinc-50 focus:border-blue-500 focus:outline-none`}
                  style={{
                    borderRadius: "8px",
                    width: "100%",
                  }}
                  placeholder="Example: Geography Quiz"
                />
              </div>

              <div className="relative flex flex-col space-y-3">
                <label
                  htmlFor="template-videos"
                  className="text-md font-medium"
                >
                  Select a background video
                </label>
                <div
                  id="template-videos"
                  className="relative flex flex-col space-y-3 max-h-[170px] overflow-y-auto border border-gray-300 rounded-md p-3"
                >
                  <div
                    className={`template-container border rounded-md p-2 cursor-pointer flex items-center ${
                      videoFile === "./public/templates/template1/video1.mp4"
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                    onClick={() =>
                      setVideoFile("./public/templates/template1/video1.mp4")
                    }
                  >
                    <div className="template-video bg-gray-200 rounded-sm">
                      <video
                        src="/templates/template1/video1.mp4"
                        className="w-20 h-12 p-1"
                      ></video>
                    </div>
                    <div className="template-info text-center flex-grow pl-4">
                      <div className="h-full flex font-medium text-md">
                        Video 1
                      </div>
                    </div>
                  </div>
                  <div
                    className={`template-container border rounded-md p-2 cursor-pointer flex items-center ${
                      videoFile === "./public/templates/template1/video2.mp4"
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                    onClick={() =>
                      setVideoFile("./public/templates/template1/video2.mp4")
                    }
                  >
                    <div className="template-video bg-gray-200 rounded-sm">
                      <video
                        src="/templates/template1/video2.mp4"
                        className="w-20 h-12 p-1"
                      ></video>
                    </div>
                    <div className="template-info text-center flex-grow pl-3">
                      <div className="h-full flex font-medium text-md">
                        Video 2
                      </div>
                    </div>
                  </div>
                  <div
                    className={`template-container border rounded-md p-2 cursor-pointer flex items-center ${
                      videoFile === "./public/templates/template1/video3.mp4"
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                    onClick={() =>
                      setVideoFile("./public/templates/template1/video3.mp4")
                    }
                  >
                    <div className="template-video bg-gray-200 rounded-sm">
                      <video
                        src="/templates/template1/video3.mp4"
                        className="w-20 h-12 p-1"
                      ></video>
                    </div>
                    <div className="template-info text-center flex-grow pl-3">
                      <div className="h-full flex font-medium text-md">
                        Video 3
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={
                  "bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300 ease-in-out"
                }
              >
                {isLoading ? "loading" : "submit"}
              </button>
            </form>
          </div>
        </div>

        {/* Right side bar */}
        <div className="shrink-0 flex-[2] lg:w-96 flex justify-center items-center">
          <div className="max-h-[540px] overflow-y-auto">
            {video ? (
              <div className="flex flex-col justify-center items-center space-y-6">
                {video.map((video) => (
                  <div
                    key={video.id}
                    className="flex justify-center items-center"
                  >
                    <video
                      src={video.url}
                      controls
                      style={{ maxWidth: "30%", maxHeight: "30%" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template1;
