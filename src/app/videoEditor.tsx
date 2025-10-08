import { useCallback, useEffect, useRef, useState } from "react";
import { usePreventScroll } from "react-aria";
import Cropper from "./cropper";
import { formatTime } from "./helper/timeHelper";
import DownloadIcon from "./icons/download";
import LoadingSpinner from "./icons/loadingspinner";
import Mute from "./icons/mute";
import PlayPauseIcon from "./icons/play";
import { MediaCrop } from "./types/mediacrop";
import { UploadFile } from "./types/uploadFile";

interface Props {
  uploadFile: UploadFile;
}

const VideoEditor: React.FC<Props> = ({ uploadFile }) => {
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.1);
  const [showVolumeBar, setShowVolumeBar] = useState<boolean>(false);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [croppedValues, setCroppedValues] = useState<MediaCrop>({
    heightPercent: 100,
    widthPercent: 100,
    xPercent: 0,
    yPercent: 0,
  });
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
      ) {
        return;
      }

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
        if (percentageProgress >= rightButtonPosition - 5) {
          return;
        }

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
        if (percentageProgress <= leftButtonPosition + 5) {
          return;
        }

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
            ? {
                start: 0,
                stop: progressInSeconds ? progressInSeconds + 0.5 : 10,
              }
            : { start: prev.start, stop: progressInSeconds }
        );
      }
    },
    [
      isLeftDragging,
      isRightDragging,
      isProgressDragging,
      leftButtonPosition,
      rightButtonPosition,
    ]
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

    setIsLeftDragging(false);
    setIsRightDragging(false);
    setIsProgressDragging(false);
  }, []);

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
      videoRef.current.currentTime = videoDuration.start + 0.5;
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
    setIsLoading(true);
    const formData = new FormData();
    formData.append("video", uploadFile.file);
    formData.append("startTime", String(videoDuration?.start ?? 0));
    formData.append(
      "endTime",
      String(videoDuration?.stop ?? videoRef.current.duration)
    );
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    const cropX = Math.round((croppedValues.xPercent / 100) * videoWidth);
    const cropY = Math.round((croppedValues.yPercent / 100) * videoHeight);
    const cropWidth = Math.round(
      (croppedValues.widthPercent / 100) * videoWidth
    );
    const cropHeight = Math.round(
      (croppedValues.heightPercent / 100) * videoHeight
    );

    formData.append("cropX", cropX.toString());
    formData.append("cropY", cropY.toString());
    formData.append("cropWidth", cropWidth.toString());
    formData.append("cropHeight", cropHeight.toString());

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      setIsLoading(false);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "trimmed.mp4";
    a.click();
    URL.revokeObjectURL(url);
    setIsLoading(false);
  }
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    videoRef.current?.play();

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      const timeArray: number[] = [];

      const parts = duration / 6;

      for (let i = 0; i <= 6; i++) {
        console.log(parts * i);
        timeArray.push(parts * i);
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

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsMute(false);
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  usePreventScroll({ isDisabled: !isCropping });

  const hasCroppedChange =
    croppedValues.heightPercent !== 100 ||
    croppedValues.widthPercent !== 100 ||
    croppedValues.xPercent !== 0 ||
    croppedValues.yPercent !== 0;

  return (
    <div className="flex flex-col  items-center relative justify-center w-full px-4 sm:max-lg:pb-[200px]">
      <div className="flex gap-2 pb-4 items-center justify-between w-full">
        <span className="text-[0.80rem] max-w-[200px] single-line-ellipsis">
          {uploadFile.file.name.slice(0, 30)}
        </span>
        <form onSubmit={handleSubmit}>
          <button
            className={`${
              hasCroppedChange ? "" : "opacity-50 pointer-events-none"
            } rounded-md cursor-pointer w-[120px] flex items-center justify-center gap-4 bg-neutral-50 py-2 text-black text-[0.80rem]`}
            type="submit"
          >
            {isLoading ? (
              <LoadingSpinner width="24px" height="24px" />
            ) : (
              <div className="flex items-center justify-center gap-3">
                Save
                <DownloadIcon width="24px" height="24px" />
              </div>
            )}
          </button>
        </form>
      </div>
      <div className="relative flex items-center justify-center w-full h-full">
        <Cropper
          setIsCropping={setIsCropping}
          setCroppedValues={setCroppedValues}
        />
        <video
          ref={videoRef}
          loop
          muted={isMute}
          playsInline
          onTimeUpdate={handleOutOfBoundariesCheck}
          preload="metadata"
          width={700}
          height={700}
          className="rounded-xl object-contain object-center max-h-[700px] max-w-full"
          src={uploadFile.src}
          disableRemotePlayback={true}
        />
        {!isCropping && (
          <>
            <button
              onClick={togglePlayPause}
              className="absolute bottom-3 left-3 z-10 cursor-pointer"
            >
              <PlayPauseIcon isPaused={isPlaying} width="24px" height="24px" />
            </button>
            <div
              onMouseEnter={() => setShowVolumeBar(true)}
              onMouseLeave={() => setShowVolumeBar(false)}
              className="absolute bottom-3 left-12 z-10 flex items-center justify-center gap-2"
            >
              <button onClick={toggleMute} className=" cursor-pointer">
                <Mute isMute={isMute} width="24px" height="24px" />
              </button>
              {showVolumeBar && (
                <div className="flex items-center pl-3 justify-center w-[50px] sm:max-lg:hidden">
                  <input
                    className="volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleVolumeChange(e);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="relative w-full h-[110px]">
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
          <div
            style={{ left: `${videoProgressBar}%` }}
            className="absolute  bottom-0 flex items-center justify-center h-[95%] z-[80] w-[2px] rounded-xl bg-red-600"
          >
            <button
              onMouseDown={handleProgressDrag}
              onTouchStart={handleProgressDrag}
              className="top-0 cursor-pointer w-3 h-3 absolute bg-red-700 rounded-full"
            ></button>
          </div>
        )}
        <div
          ref={videoBarRef}
          className="min-w-full flex bg-neutral-900 cursor-pointer relative  h-10   z-[5] rounded-lg"
        >
          <button
            onMouseDown={handleLeftButtonDrag}
            onTouchStart={handleLeftButtonDrag}
            ref={leftButton}
            style={{ left: `${leftButtonPosition}%` }}
            className="absolute z-5 cursor-pointer"
          >
            <div className="relative flex items-center justify-center h-10">
              <div className="absolute -inset-2" />
              <div className="h-10 bg-white w-[6px] rounded-xl z-10" />
            </div>
          </button>
          <button
            onMouseDown={handleRightButtonDrag}
            onTouchStart={handleRightButtonDrag}
            ref={rightButton}
            style={{
              left: `${rightButtonPosition}%`,
              transform: "translateX(-80%)",
            }}
            className="absolute z-5 cursor-pointer"
          >
            <div className="relative flex items-center justify-center h-10">
              <div className="absolute -inset-2" />
              <div className="h-10 bg-white w-[6px] rounded-xl z-10" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
export default VideoEditor;
