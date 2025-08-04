import { useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
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

interface CalibrationViewProps {
  onComplete?: () => void; // CustomerView에서 호출될 때 사용
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
      className="bg-gradient-to-r from-blue-800 to-purple-500 w-[40px] h-[40px] rounded-full absolute cursor-pointer z-50 shadow-2xl border-4 border-white animate-pulse hover:scale-110 transition-transform duration-200"
      style={{
        left: `${point.x - 20}px`,
        top: `${point.y - 20}px`,
        boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
      }}
      onClick={onClick}
    >
      <div className="w-full h-full rounded-full bg-blue-300 bg-opacity-30 flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full"></div>
      </div>
    </div>
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
      className="w-6 h-6 bg-red-500 rounded-full pointer-events-none absolute z-50 shadow-lg border-2 border-white animate-pulse"
      style={{
        display: visible ? "block" : "none",
        transform: "translate(-50%, -50%)",
        boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)",
      }}
    ></div>
  );
};

export default function CalibrationView({ onComplete }: CalibrationViewProps) {
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
      statusRef.current.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-blue-800 rounded-full animate-pulse"></div>
          <span>🧠 학습 중: ${index + 1}번 점 (${newCount}/3)</span>
        </div>
      `;
    }

    if (newCount >= 3) {
      setClickCount(0);
      setCurrent((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (
      isCalibrationFinished &&
      mode === "calibration" &&
      points.length !== 0
    ) {
      setMode("tracking");
      if (statusRef.current) statusRef.current.style.display = "none";
      console.log("Calibration finished, starting tracking mode", points, mode);
    }
  }, [isCalibrationFinished, mode, points]);

  // 트래킹 모드 시작 후 3초 후 자동 완료
  useEffect(() => {
    if (mode === "tracking") {
      const autoCompleteTimer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          navigate("/customer");
        }
      }, 3000);

      return () => clearTimeout(autoCompleteTimer);
    }
  }, [mode, onComplete, navigate]);

  useEffect(() => {
    const setup = async () => {
      if (!window.webgazer || !window.webgazer.isReady()) {
        await window.webgazer.setRegression("ridge").begin();
      }
      // 비디오 피드 보이게 하기
      window.webgazer.showVideoPreview(true).showPredictionPoints(true);

      setPoints(generateShuffledPoints(4, 4));
      setCurrent(0);
      setClickCount(0);
    };
    setup();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
      {/* 헤더 */}
      {mode === "calibration" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200 z-50">
          <h1 className="text-2xl font-bold text-blue-300 mb-2">
            👁️ Eye Tracking 캘리브레이션
          </h1>
          <p className="text-gray-600">
            고객의 시선을 추적하기 위한 학습 중입니다.
          </p>
          <p className="text-gray-600">파란점을 3번씩 클릭해주세요.</p>
          <div>
            <div className="text-gray-600 text-sm mb-2">진행률</div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-800 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(current / points.length) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {current} / {points.length} 완료
            </div>
          </div>
        </div>
      )}

      {/* 상태 표시 */}

      {/* 캘리브레이션 점 */}
      {mode === "calibration" && currentPoint && (
        <CalibrationDot
          point={currentPoint}
          index={current}
          onClick={() =>
            handleDotClick(currentPoint.x, currentPoint.y, current)
          }
        />
      )}

      {/* 트래커 */}
      <Tracker visible={mode === "tracking"} trackerRef={trackerRef} />

      {/* 트래킹 모드 완료 화면 */}
      {mode === "tracking" && (
        <div className="absolute inset-0 flex items-center justify-center  bg-opacity-50 p-8 z-50">
          <div className="bg-white-800 rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              설정 완료!
            </h2>
            <p className="text-gray-600 mb-6">고객 화면으로 이동합니다...</p>
          </div>
        </div>
      )}

      {/* 진행률 표시 */}
      {mode === "calibration" && (
        <div className="absolute top-8 right-8 bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200 z-40">
          <div className="text-gray-600 text-sm mb-2">진행률</div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-800 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(current / points.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {current} / {points.length} 완료
          </div>
        </div>
      )}
    </div>
  );
}
