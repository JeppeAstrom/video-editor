import { NextPage } from "next";
interface Props {
  width?: string;
  height?: string;
  className?: string;
  isMute?: boolean;
}

const Mute: NextPage<Props> = ({
  height = "24px",
  width = "24px",
  className,
  isMute = false,
}) => {
  return (
    <>
      {isMute ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          className={className}
          fill="white"
        >
          <path
            xmlns="http://www.w3.org/2000/svg"
            d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          className={className}
          fill="white"
        >
          <path
            xmlns="http://www.w3.org/2000/svg"
            d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320Z"
          />
        </svg>
      )}
    </>
  );
};
export default Mute;
