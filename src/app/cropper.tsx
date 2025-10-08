import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import useMediaQuery from "./hooks/matchmedia";
import { MediaCrop } from "./types/mediacrop";

interface Props {
  setCroppedValues: Dispatch<SetStateAction<MediaCrop>>;
  setIsCropping?: Dispatch<SetStateAction<boolean>>;
}
const Cropper: React.FC<Props> = ({ setCroppedValues, setIsCropping }) => {
  const isLargeScreen = useMediaQuery("(min-width: 1096px)");

  const cropperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<
    "leftbottom" | "rightbottom" | "lefttop" | "righttop" | null
  >(null);

  const [leftBottomCoords, setLeftBottomCoords] = useState({ x: 0, y: 100 });
  const [rightBottomCoords, setRightBottomCoords] = useState({
    x: 100,
    y: 100,
  });
  const [leftTopCoords, setLeftTopCoords] = useState({ x: 0, y: 0 });
  const [rightTopCoords, setRightTopCoords] = useState({ x: 100, y: 0 });

  const handleMouseMove = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.current || !cropperRef.current) return;

    if (event instanceof TouchEvent) {
      event.preventDefault();
    }

    setIsCropping && setIsCropping(true);
    let clientX = 0;
    let clientY = 0;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    const rect = cropperRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    if (x > 100 || x < 0 || y < 0 || y > 100) {
      return;
    }

    updateCornerCoords(isDragging.current, x, y);
  };

  const updateCornerCoords = (corner: string, x: number, y: number) => {
    switch (corner) {
      case "leftbottom":
        setLeftBottomCoords({ x, y });
        setLeftTopCoords((prev) => ({ x, y: prev.y }));
        setRightBottomCoords((prev) => ({ x: prev.x, y }));
        break;
      case "rightbottom":
        setRightBottomCoords({ x, y });
        setRightTopCoords((prev) => ({ x, y: prev.y }));
        setLeftBottomCoords((prev) => ({ x: prev.x, y }));
        break;
      case "lefttop":
        setLeftTopCoords({ x, y });
        setLeftBottomCoords((prev) => ({ x, y: prev.y }));
        setRightTopCoords((prev) => ({ x: prev.x, y }));
        break;
      case "righttop":
        setRightTopCoords({ x, y });
        setRightBottomCoords((prev) => ({ x, y: prev.y }));
        setLeftTopCoords((prev) => ({ x: prev.x, y }));
        break;
    }
  };

  const [updateValues, setUpdateValues] = useState<boolean>(false);

  useEffect(() => {
    if (updateValues) {
      const croppedValues: MediaCrop = {
        xPercent: Math.min(leftTopCoords.x, leftBottomCoords.x),
        yPercent: Math.min(leftTopCoords.y, rightTopCoords.y),
        widthPercent: Math.abs(rightTopCoords.x - leftTopCoords.x),
        heightPercent: Math.abs(leftBottomCoords.y - leftTopCoords.y),
      };
      setCroppedValues(croppedValues);
    }
  }, [updateValues]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopDrag);

    document.addEventListener("touchmove", handleMouseMove);
    document.addEventListener("touchend", stopDrag);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", stopDrag);
    };
  }, []);

  const startDrag = (
    corner: "lefttop" | "righttop" | "leftbottom" | "rightbottom"
  ) => {
    isDragging.current = corner;

    if (!isLargeScreen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    }

    setIsCropping && setIsCropping(true);
  };

  const stopDrag = () => {
    const scrollY = -parseInt(document.body.style.top || "0");

    if (!isLargeScreen) {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    }

    isDragging.current = null;
    setIsCropping && setIsCropping(false);
    setUpdateValues(true);
    setTimeout(() => setUpdateValues(false), 100);
  };

  return (
    <div ref={cropperRef} className="absolute h-full w-full ">
      <button
        className="absolute z-[10000] h-5 w-5 bg-white rounded-full cursor-pointer"
        style={{
          left: `${leftTopCoords.x}%`,
          top: `${leftTopCoords.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        onMouseDown={() => startDrag("lefttop")}
        onTouchStart={() => startDrag("lefttop")}
      />
      <button
        className="absolute z-[10000] h-5 w-5 bg-white rounded-full cursor-pointer"
        style={{
          left: `${leftBottomCoords.x}%`,
          top: `${leftBottomCoords.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        onMouseDown={() => startDrag("leftbottom")}
        onTouchStart={() => startDrag("leftbottom")}
      />
      <button
        className="absolute z-[10000] h-5 w-5 bg-white rounded-full cursor-pointer"
        style={{
          left: `${rightTopCoords.x}%`,
          top: `${rightTopCoords.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        onMouseDown={() => startDrag("righttop")}
        onTouchStart={() => startDrag("righttop")}
      />

      <button
        className="absolute z-[10000] h-5 w-5 bg-white rounded-full cursor-pointer"
        style={{
          left: `${rightBottomCoords.x}%`,
          top: `${rightBottomCoords.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        onMouseDown={() => startDrag("rightbottom")}
        onTouchStart={() => startDrag("rightbottom")}
      />
      <div
        className="absolute z-[9999] bg-white"
        style={{
          left: `${leftBottomCoords.x}%`,
          top: `${leftBottomCoords.y}%`,
          width: `${rightBottomCoords.x - leftBottomCoords.x}%`,
          height: "2px",
        }}
      />
      <div
        className="absolute z-[9999] bg-white cursor-pointer"
        style={{
          left: `${leftTopCoords.x}%`,
          top: `${leftTopCoords.y}%`,
          width: `${rightBottomCoords.x - leftBottomCoords.x}%`,
          height: "2px",
        }}
      />
      <div
        className="absolute w-[2px] bg-white"
        style={{
          left: `${rightTopCoords.x}%`,
          top: `${Math.min(rightTopCoords.y, rightBottomCoords.y)}%`,
          height: `${Math.abs(rightBottomCoords.y - rightTopCoords.y)}%`,
        }}
      />
      <div
        className="absolute w-[2px] bg-white"
        style={{
          left: `${leftTopCoords.x}%`,
          top: `${Math.min(leftTopCoords.y, leftBottomCoords.y)}%`,
          height: `${Math.abs(leftBottomCoords.y - leftTopCoords.y)}%`,
        }}
      />
    </div>
  );
};
export default Cropper;
