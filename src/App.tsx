import { useEffect, useRef, useState } from "react";

// webgazer 글로벌 변수 선언
declare global {
  interface Window {
    webgazer: any;
  }
}

export default function App() {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [current, setCurrent] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [trackingMode, setTrackingMode] = useState(false);
  const trackerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const createCalibrationPoints = (rows = 4, cols = 4) => {
    const padding = 80;
    const spacingX = (window.innerWidth - 2 * padding) / (cols - 1);
    const spacingY = (window.innerHeight - 2 * padding) / (rows - 1);
    const result: { x: number; y: number }[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({
          x: padding + col * spacingX,
          y: padding + row * spacingY,
        });
      }
    }
    setPoints(result);
    setCurrent(0);
    setClickCount(0);
  };

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
    setTrackingMode(true);
    if (statusRef.current) statusRef.current.style.display = "none";

    window.webgazer.setGazeListener((data: any) => {
      if (data && trackerRef.current) {
        trackerRef.current.style.left = `${data.x}px`;
        trackerRef.current.style.top = `${data.y}px`;
      }
    });
  };

  // 초기화 및 웹게이저 설정
  useEffect(() => {
    const setup = async () => {
      await window.webgazer.setRegression("ridge").begin();
      createCalibrationPoints();
    };
    setup();
  }, []);

  const currentPoint = points.length > current ? points[current] : null;
  const isFinished = current >= points.length;

  return (
    <div
      ref={containerRef}
      className="w-full h-screen relative overflow-hidden bg-white"
    >
      {!trackingMode && currentPoint && (
        <div
          key={`dot-${current}`}
          className="bg-blue-500 w-[30px] h-[30px] rounded-full absolute cursor-pointer z-50"
          style={{
            left: `${currentPoint.x}px`,
            top: `${currentPoint.y}px`,
          }}
          onClick={() =>
            handleDotClick(currentPoint.x, currentPoint.y, current)
          }
        />
      )}

      {/* tracker */}
      <div
        ref={trackerRef}
        className="w-5 h-5 bg-red-500 rounded-full pointer-events-none absolute z-50"
        style={{ display: trackingMode ? "block" : "none" }}
      ></div>

      {/* 시작 버튼 */}
      {isFinished && !trackingMode && (
        <button
          onClick={startTrackingMode}
          className="absolute top-5 left-5 z-50 text-lg px-4 py-2 bg-white border rounded shadow"
        >
          🎯 실전 모드 시작
        </button>
      )}

      {/* 상태 텍스트 */}
      <div
        ref={statusRef}
        className="absolute top-[60px] left-5 text-black text-base bg-white px-3 py-2 rounded z-50"
      >
        🧠 학습 중: 1번 점 클릭 (0/3)
      </div>
    </div>
  );
}
