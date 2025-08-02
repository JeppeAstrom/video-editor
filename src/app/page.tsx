"use client";

import { useState } from "react";
import { UploadFile } from "./types/uploadFile";
import VideoPlayer from "./videoPlayer";

export default function Home() {
  const [medias, setMedias] = useState<UploadFile[]>([]);

  const uploadFileHandler = (fileList: FileList | null) => {
    if (!fileList) return;

    const files = [...fileList];
    files.filter((x) => x.type.startsWith("video/"));

    files.forEach((file) => {
      setMedias((prev) => [
        ...prev,
        {
          src: URL.createObjectURL(file),
          file: file,
        },
      ]);
    });
  };

  if (medias.length === 0) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center pb-40">
        <div
          onChange={(e) => {
            if (e.type === "file") {
            }
          }}
          className="bg-neutral-50 relative flex items-center justify-center z-5 rounded-xl w-[350px] h-[100px]  px-5 p-2 text-black text-[0.85rem] font-semibold"
        >
          Tap to upload the file you want to edit ...
          <input
            onChange={(e) => {
              uploadFileHandler(e.target.files);
            }}
            multiple
            type="file"
            className="opacity-0 w-full h-full absolute cursor-pointer"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center mx-auto lg:max-w-[800px] w-full py-4 gap-4">
      {medias.map((file, index) => (
        <div key={index}>
          <VideoPlayer uploadFile={file} />
        </div>
      ))}
    </div>
  );
}
