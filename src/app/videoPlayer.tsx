import { useEffect, useRef, useState } from "react";
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

  const [videoDuration, setVideoDuration] = useState<{
    start: number;
    stop: number;
  }>();

  const updateVideoProgressBar = () => {
    if (!videoRef.current) return;

    const time = Math.round(videoRef.current.currentTime);
    const videoLength = videoRef.current.duration;
    const currentProgress = (time / videoLength) * 100;

    setVideoProgressBar(currentProgress);
  };

  const handleProgressBarClick = (event: MouseEvent) => {
    if (
      !videoBarRef.current ||
      !videoRef.current ||
      leftButton.current?.contains(event.target as Node) ||
      rightButton.current?.contains(event.target as Node)
    )
      return;

    const progressBarWidth = videoBarRef.current.clientWidth;
    const progressBarRelative = videoBarRef.current.getBoundingClientRect();

    const clickPosition = event.clientX - progressBarRelative.left;

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

  const [isLeftDragging, setIsLeftDragging] = useState<boolean>(false);
  const [isRightDragging, setIsRightDragging] = useState<boolean>(false);

  const handleEditButtonMove = (e: MouseEvent) => {
    if (
      !videoBarRef.current ||
      !videoRef.current ||
      (!isRightDragging && !isLeftDragging)
    )
      return;
    const progressBarWidth = videoBarRef.current?.clientWidth;

    const progressBarRelative = videoBarRef.current.getBoundingClientRect();

    const currentClickPosition = e.clientX - progressBarRelative.left;

    const progress = currentClickPosition / progressBarWidth;

    const progressInSeconds = videoRef.current.duration * progress;

    const percentageProgress = progress * 100;

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
          ? { start: progressInSeconds, stop: videoRef.current?.duration ?? 10 }
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
  };

  const handleLeftButtonDrag = () => {
    setIsLeftDragging(true);
  };

  const handleRightButtonDrag = () => {
    setIsRightDragging(true);
  };

  useEffect(() => {
    if (!videoRef.current || !videoBarRef.current || !leftButton.current)
      return;

    const video = videoRef.current;
    const videoBar = videoBarRef.current;

    video.addEventListener("timeupdate", updateVideoProgressBar);
    videoBar.addEventListener("mousedown", handleProgressBarClick);

    return () => {
      if (video) {
        video.removeEventListener("timeupdate", updateVideoProgressBar);
      }
      if (videoBar) {
        videoBar.removeEventListener("mousedown", handleProgressBarClick);
      }
    };
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleEditButtonMove);
    document.addEventListener("mouseup", () => {
      setIsLeftDragging(false);
      setIsRightDragging(false);
    });

    return () => {
      document.removeEventListener("mousemove", handleEditButtonMove);
      document.removeEventListener("mouseup", () => {
        setIsLeftDragging(false);
        setIsRightDragging(false);
      });
    };
  });

  const handleOutOfBoundriesCheck = () => {
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

  return (
    <>
      <video
        ref={videoRef}
        muted
        autoPlay
        loop
        onTimeUpdate={handleOutOfBoundriesCheck}
        preload="metadata"
        className="aspect-square bg-black w-full h-full"
        src={uploadFile.src}
      />
      <div
        ref={videoBarRef}
        className="w-full flex bg-black/50 h-10 relative z-5 mt-5"
      >
        {!isLeftDragging && (
          <span
            style={{ left: `${videoProgressBar}%` }}
            className="absolute h-10 w-[2px] bg-red-400"
          ></span>
        )}

        <button
          onMouseDown={handleLeftButtonDrag}
          ref={leftButton}
          style={{ left: `${leftButtonPosition}%` }}
          className="absolute flex items-center justify-center  w-[10px]  z-5"
        >
          <div className="h-10 bg-white w-[6px] rounded-xl"></div>
        </button>
        <button
          onMouseDown={handleRightButtonDrag}
          ref={rightButton}
          style={{ left: `${rightButtonPosition}%` }}
          className="absolute flex items-center justify-center  w-[10px]  z-5"
        >
          <div className="h-10 bg-white w-[6px] rounded-xl"></div>
        </button>
      </div>
    </>
  );
};
export default VideoPlayer;
