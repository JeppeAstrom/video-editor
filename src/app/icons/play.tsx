import { NextPage } from "next";

interface Props {
  width?: string;
  height?: string;
  className?: string;
  isPaused?: boolean;
}

const PlayPauseIcon: NextPage<Props> = ({
  height,
  width,
  className,
  isPaused = false,
}) => {
  return (
    <>
      {isPaused ? (
        <svg
          className={className}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="white"
        >
          <path
            xmlns="http://www.w3.org/2000/svg"
            d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"
          />
        </svg>
      ) : (
        <svg
          className={className}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="white"
        >
          <path
            xmlns="http://www.w3.org/2000/svg"
            d="M320-200v-560l440 280-440 280Z"
          />
        </svg>
      )}
    </>
  );
};
export default PlayPauseIcon;
