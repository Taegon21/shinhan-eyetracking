import { useEffect, useRef, useState, type RefObject } from "react";
import { websocketService } from "./util/WebSocketService";
import { generateShuffledPoints } from "./util/utilFunction";

// webgazer 글로벌 변수 선언
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webgazer: any;
  }
}

interface Point {
  x: number;
  y: number;
}

const CalibrationDot = ({
  point,
  index,
  onClick,
}: {
  point: Point;
  index: number;
  onClick: () => void;
}) => {
  return (
    <div
      key={`dot-${index}`}
      className="bg-blue-500 w-[30px] h-[30px] rounded-full absolute cursor-pointer z-50"
      style={{ left: `${point.x}px`, top: `${point.y}px` }}
      onClick={onClick}
    />
  );
};

const Tracker = ({
  visible,
  trackerRef,
}: {
  visible: boolean;
  trackerRef: RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div
      ref={trackerRef}
      className="w-5 h-5 bg-red-500 rounded-full pointer-events-none absolute z-50"
      style={{ display: visible ? "block" : "none" }}
    ></div>
  );
};

export default function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [current, setCurrent] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [mode, setMode] = useState<"calibration" | "tracking">("calibration");

  const trackerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPoint = points.length > current ? points[current] : null;
  const isCalibrationFinished = current >= points.length;

  const handleDotClick = (x: number, y: number, index: number) => {
    window.webgazer.recordScreenPosition(x, y);
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (statusRef.current) {
      statusRef.current.textContent = `🧠 학습 중: ${index + 1}번 점 클릭 (${newCount}/3)`;
    }

    if (newCount >= 3) {
      setClickCount(0);
      setCurrent((prev) => prev + 1);
    }
  };

  const startTrackingMode = () => {
    setMode("tracking");
    if (statusRef.current) statusRef.current.style.display = "none";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.webgazer.setGazeListener((data: any) => {
      if (data && trackerRef.current) {
        trackerRef.current.style.left = `${data.x}px`;
        trackerRef.current.style.top = `${data.y}px`;
        websocketService.sendGazeData(data.x, data.y);
      }
    });
  };

  useEffect(() => {
    const setup = async () => {
      await window.webgazer.setRegression("ridge").begin();
      setPoints(generateShuffledPoints(4, 4));
      setCurrent(0);
      setClickCount(0);
    };
    setup();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen relative overflow-hidden bg-white"
    >
      {mode === "calibration" && currentPoint && (
        <CalibrationDot
          point={currentPoint}
          index={current}
          onClick={() =>
            handleDotClick(currentPoint.x, currentPoint.y, current)
          }
        />
      )}

      <Tracker visible={mode === "tracking"} trackerRef={trackerRef} />

      {isCalibrationFinished && mode === "calibration" && (
        <button
          onClick={startTrackingMode}
          className="absolute top-5 left-5 z-50 text-lg px-4 py-2 bg-white border rounded shadow"
        >
          🎯 실전 모드 시작
        </button>
      )}

      <div
        ref={statusRef}
        className="absolute top-[60px] left-5 text-black text-base bg-white px-3 py-2 rounded z-50"
      >
        🧠 학습 중: 1번 점 클릭 (0/3)
      </div>
    </div>
  );
}
