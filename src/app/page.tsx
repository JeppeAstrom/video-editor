"use client";

import { useState } from "react";
import { UploadFile } from "./types/uploadFile";
import VideoPlayer from "./videoPlayer";

export default function Home() {
  const [media, setMedia] = useState<UploadFile>();

  const uploadFileHandler = (fileList: FileList | null) => {
    if (!fileList) return;

    const file = [...fileList][0];

    if (!file.type.startsWith("video/")) {
      return;
    }

    setMedia({
      src: URL.createObjectURL(file),
      file: file,
    });
  };
  if (!media) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center pb-40">
        <div
          onChange={(e) => {
            if (e.type === "file") {
            }
          }}
          className="bg-neutral-50 relative flex items-center justify-center z-5 rounded-md w-[200px]  px-5 p-2 text-black text-[0.85rem] font-semibold"
        >
          Upload file
          <input
            onChange={(e) => {
              uploadFileHandler(e.target.files);
            }}
            type="file"
            className="opacity-0 w-full h-full absolute cursor-pointer"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center mx-auto lg:max-w-[600px] w-full py-4">
      <VideoPlayer uploadFile={media} />
    </div>
  );
}
