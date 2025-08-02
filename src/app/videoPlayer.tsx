import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "./helper/timeHelper";
import DownloadIcon from "./icons/download";
import Mute from "./icons/mute";
import PlayPauseIcon from "./icons/play";
import { UploadFile } from "./types/uploadFile";

interface Props {
  uploadFile: UploadFile;
}

const VideoPlayer: React.FC<Props> = ({ uploadFile }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBarRef = useRef<HTMLDivElement>(null);
  const leftButton = useRef<HTMLButtonElement>(null);
  const rightButton = useRef<HTMLButtonElement>(null);

  const [videoProgressBar, setVideoProgressBar] = useState<number>(0);
  const [leftButtonPosition, setLeftButtonPosition] = useState<number>(0);
  const [rightButtonPosition, setRightButtonPosition] = useState<number>(100);
  const [timeArray, setTimeArray] = useState<number[]>();
  const [isMute, setIsMute] = useState<boolean>(true);
  const [isLeftDragging, setIsLeftDragging] = useState<boolean>(false);
  const [isRightDragging, setIsRightDragging] = useState<boolean>(false);
  const [isProgressDragging, setIsProgressDragging] = useState<boolean>(false);

  const [videoDuration, setVideoDuration] = useState<{
    start: number;
    stop: number;
  }>();

  const updateVideoProgressBar = () => {
    if (!videoRef.current) return;

    const time = videoRef.current.currentTime;
    const videoLength = videoRef.current.duration;
    const currentProgress = (time / videoLength) * 100;

    setVideoProgressBar(currentProgress);
  };

  const handleProgressBarClick = (event: MouseEvent | TouchEvent) => {
    if (
      !videoBarRef.current ||
      !videoRef.current ||
      leftButton.current?.contains(event.target as Node) ||
      rightButton.current?.contains(event.target as Node)
    )
      return;

    const progressBarWidth = videoBarRef.current.clientWidth;
    const progressBarRelative = videoBarRef.current.getBoundingClientRect();

    let clientX = 0;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
    }

    const clickPosition = clientX - progressBarRelative.left;

    const progress = clickPosition / progressBarWidth;

    const progressInSeconds = videoRef.current.duration * progress;

    if (
      videoDuration &&
      (progressInSeconds > videoDuration.stop ||
        progressInSeconds < videoDuration.start)
    ) {
      videoRef.current.currentTime = videoDuration.start;
      return;
    }

    videoRef.current.currentTime = progressInSeconds;
  };

  const handleEditButtonMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (
        !videoBarRef.current ||
        !videoRef.current ||
        (!isRightDragging && !isLeftDragging && !isProgressDragging)
      )
        return;

      const progressBarWidth = videoBarRef.current?.clientWidth;

      const progressBarRelative = videoBarRef.current.getBoundingClientRect();

      let clientX = 0;
      if (event instanceof MouseEvent) {
        clientX = event.clientX;
      } else if (event instanceof TouchEvent) {
        clientX = event.touches[0].clientX;
      }

      const currentClickPosition = clientX - progressBarRelative.left;

      const progress = currentClickPosition / progressBarWidth;

      const progressInSeconds = videoRef.current.duration * progress;

      const percentageProgress = progress * 100;

      if (isProgressDragging) {
        videoRef.current.currentTime = progressInSeconds;
        setVideoProgressBar(Math.min(100, Math.max(0, percentageProgress)));
        return;
      }

      if (isLeftDragging) {
        if (percentageProgress < 0) {
          setLeftButtonPosition(0);
          return;
        }
        if (percentageProgress > 100) {
          setLeftButtonPosition(100);
          return;
        }
        setLeftButtonPosition(percentageProgress);
        videoRef.current.currentTime = progressInSeconds;
        setVideoDuration((prev) =>
          prev === undefined
            ? {
                start: progressInSeconds,
                stop: videoRef.current?.duration ?? 10,
              }
            : { start: progressInSeconds, stop: prev.stop }
        );
      }
      if (isRightDragging) {
        if (percentageProgress < 0) {
          setRightButtonPosition(0);
          return;
        }
        if (percentageProgress > 100) {
          setRightButtonPosition(100);
          return;
        }
        setRightButtonPosition(percentageProgress);
        setVideoDuration((prev) =>
          prev === undefined
            ? { start: 0, stop: progressInSeconds ?? 10 }
            : { start: prev.start, stop: progressInSeconds }
        );
      }
    },
    [isLeftDragging, isRightDragging, isProgressDragging]
  );

  const handleLeftButtonDrag = () => {
    setIsLeftDragging(true);
  };

  const handleRightButtonDrag = () => {
    setIsRightDragging(true);
  };

  const handleProgressDrag = () => {
    setIsProgressDragging(true);
  };

  useEffect(() => {
    if (!videoRef.current || !videoBarRef.current || !leftButton.current)
      return;

    const video = videoRef.current;
    const videoBar = videoBarRef.current;

    video.addEventListener("timeupdate", updateVideoProgressBar);
    videoBar.addEventListener("mousedown", handleProgressBarClick);
    videoBar.addEventListener("touchstart", handleProgressBarClick);
    return () => {
      if (video) {
        video.removeEventListener("timeupdate", updateVideoProgressBar);
      }
      if (videoBar) {
        videoBar.removeEventListener("mousedown", handleProgressBarClick);
        videoBar.removeEventListener("touchstart", handleProgressBarClick);
      }
    };
  }, []);

  const handleEditButtonStop = useCallback(() => {
    if (!videoRef.current) return;

    if (isLeftDragging && videoDuration) {
      videoRef.current.currentTime = videoDuration.start;
    } else if (isRightDragging && videoDuration) {
      videoRef.current.currentTime = videoDuration.stop;
    }
    setIsLeftDragging(false);
    setIsRightDragging(false);
    setIsProgressDragging(false);
  }, [isLeftDragging, isRightDragging, videoDuration]);

  useEffect(() => {
    document.addEventListener("mousemove", handleEditButtonMove);
    document.addEventListener("touchmove", handleEditButtonMove);
    document.addEventListener("mouseup", handleEditButtonStop);
    document.addEventListener("touchend", handleEditButtonStop);

    return () => {
      document.removeEventListener("mousemove", handleEditButtonMove);
      document.removeEventListener("touchmove", handleEditButtonMove);
      document.removeEventListener("mouseup", handleEditButtonStop);
      document.removeEventListener("touchend", handleEditButtonStop);
    };
  }, [handleEditButtonMove, handleEditButtonStop]);

  const handleOutOfBoundariesCheck = () => {
    if (!videoRef.current) return;

    const time = Math.round(videoRef.current.currentTime);
    const videoLength = videoRef.current.duration;
    const currentProgress = (time / videoLength) * 100;
    if (
      currentProgress >= rightButtonPosition &&
      videoDuration &&
      !isRightDragging &&
      !isLeftDragging
    ) {
      videoRef.current.currentTime = videoDuration.start;
      videoRef.current.play();
    }
    if (
      currentProgress < leftButtonPosition &&
      videoDuration &&
      !isRightDragging &&
      !isLeftDragging
    ) {
      videoRef.current.currentTime = videoDuration.start;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!videoRef.current) return;

    const formData = new FormData();
    formData.append("video", uploadFile.file);
    formData.append("startTime", String(videoDuration?.start ?? 0));
    formData.append(
      "endTime",
      String(videoDuration?.stop ?? videoRef.current.duration)
    );

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return alert("Trimming failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "trimmed.mp4";
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    videoRef.current?.play();

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      const timeArray: number[] = [];

      for (let i = 0; i <= 6; i++) {
        timeArray.push((duration / 10) * i);
      }

      setTimeArray(timeArray);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    setIsMute((prev) => !prev);
  };

  return (
    <div className="flex flex-col  items-center relative justify-center w-full px-2">
      <div className="flex gap-2 pb-4 items-center justify-between w-full">
        <span className="text-[0.80rem] max-w-[200px] overflow-x-auto single-line-ellipsis">
          {uploadFile.file.name.slice(0, 35)}
        </span>
        <form onSubmit={handleSubmit}>
          <button
            className="rounded-md cursor-pointer w-[120px] flex items-center justify-center gap-4 bg-neutral-50 py-2 text-black text-[0.80rem]"
            type="submit"
          >
            Export
            <DownloadIcon width="24px" height="24px" />
          </button>
        </form>
      </div>
      <div className="relative flex items-center justify-center w-full h-full">
        <video
          ref={videoRef}
          loop
          muted={isMute}
          onTimeUpdate={handleOutOfBoundariesCheck}
          preload="metadata"
          className="aspect-square bg-black w-full h-full rounded-xl"
          src={uploadFile.src}
        />
        <button
          onClick={togglePlayPause}
          className="absolute bottom-3 left-3 z-10 cursor-pointer"
        >
          <PlayPauseIcon isPaused={isPlaying} width="24px" height="24px" />
        </button>
        <button
          onClick={toggleMute}
          className="absolute bottom-3 left-12 z-10 cursor-pointer"
        >
          <Mute isMute={isMute} width="24px" height="24px" />
        </button>
      </div>
      <div className="relative w-full h-[100px]">
        <div className="relative w-full flex grid-cols-6 py-4 items-center justify-between px-2">
          {timeArray &&
            timeArray.map((time, index) => (
              <span
                key={index}
                className="bottom-0 text-[0.75rem] text-gray-400"
              >
                {formatTime(Math.floor(time))}
              </span>
            ))}
        </div>
        {!isLeftDragging && (
          <button
            onMouseDown={handleProgressDrag}
            onTouchStart={handleProgressDrag}
            style={{ left: `${videoProgressBar}%` }}
            className="absolute cursor-pointer bottom-0 h-[60%] z-[40] w-[6px] rounded-xl bg-blue-400"
          ></button>
        )}
        <div
          ref={videoBarRef}
          className="min-w-full flex bg-neutral-900 cursor-pointer  h-10  relative z-[5]  rounded-xl"
        >
          <button
            onMouseDown={handleLeftButtonDrag}
            onTouchStart={handleLeftButtonDrag}
            ref={leftButton}
            style={{ left: `${leftButtonPosition}%` }}
            className="absolute flex items-center justify-center  w-[10px]  z-5 cursor-pointer"
          >
            <div className="h-10 bg-white w-[6px] rounded-xl"></div>
          </button>
          <button
            onMouseDown={handleRightButtonDrag}
            onTouchStart={handleRightButtonDrag}
            ref={rightButton}
            style={{
              left: `${rightButtonPosition}%`,
              transform: "translateX(-80%)",
            }}
            className="absolute flex items-center justify-center  w-[10px]  z-5 cursor-pointer"
          >
            <div className="h-10 bg-white w-[6px] rounded-xl"></div>
          </button>
        </div>
      </div>
    </div>
  );
};
export default VideoPlayer;
