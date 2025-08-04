import { useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { websocketService } from "../util/WebSocketService";
import { generateShuffledPoints } from "../util/utilFunction";

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

export default function CalibrationView() {
  const navigate = useNavigate();
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

  const goToCustomerView = () => {
    // 캘리브레이션 완료 후 CustomerView로 이동
    navigate("/customer");
  };

  const goToEmployeeView = () => {
    // EmployeeView로 이동 (새 탭)
    window.open("/employee", "_blank");
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
        <div className="absolute top-5 left-5 z-50 space-y-3">
          <button
            onClick={startTrackingMode}
            className="block text-lg px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          >
            🎯 실전 모드 시작
          </button>
        </div>
      )}

      {/* 트래킹 모드에서 추가 옵션 */}
      {mode === "tracking" && (
        <div className="absolute top-5 left-5 z-50 space-y-3">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
            ✅ 캘리브레이션 완료!
          </div>
          <button
            onClick={goToCustomerView}
            className="block text-lg px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600"
          >
            👤 고객 화면으로 이동
          </button>
          <button
            onClick={goToEmployeeView}
            className="block text-lg px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-600"
          >
            👨‍💼 직원 화면 열기 (새 탭)
          </button>
          <button
            onClick={() => {
              // 자동으로 고객 화면 이동 + 직원 화면 새 탭 열기
              goToEmployeeView();
              setTimeout(() => goToCustomerView(), 500);
            }}
            className="block text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded shadow hover:from-blue-600 hover:to-purple-600"
          >
            🚀 시뮬레이션 시작
          </button>
        </div>
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
