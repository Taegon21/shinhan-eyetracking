import { useEffect, useRef, useState } from "react";
import { websocketService, type GazeData } from "../util/WebSocketService";
import Calibration from "../component/Calibration";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webgazer: any;
  }
}

export default function CustomerView() {
  const trackerRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<
    "checking" | "needed" | "ready"
  >("checking");

  useEffect(() => {
    // WebSocket 연결
    websocketService.connect();

    // WebGazer 상태 확인
    const checkCalibration = () => {
      if (!window.webgazer) {
        console.warn("WebGazer 라이브러리가 로드되지 않았습니다.");
        setCalibrationStatus("needed");
        return;
      }

      // WebGazer가 이미 시작되었는지 확인
      if (window.webgazer.isReady && window.webgazer.isReady()) {
        console.log("✅ WebGazer 이미 준비됨 - 트래킹 시작");
        console.log("WebGazer 상태:", window.webgazer.getCurrentPrediction());
        window.webgazer.showVideoPreview(false).showPredictionPoints(false);
        startTracking();
      } else {
        console.log("❌ Calibration 필요");
        setCalibrationStatus("needed");
      }
    };

    const timer = setTimeout(checkCalibration, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const startTracking = () => {
    if (!window.webgazer) return;

    try {
      setIsTracking(true);
      setCalibrationStatus("ready");

      window.webgazer.setGazeListener((data: GazeData) => {
        if (data && trackerRef.current) {
          trackerRef.current.style.left = `${data.x}px`;
          trackerRef.current.style.top = `${data.y}px`;

          const targetElement = document.elementFromPoint(data.x, data.y);
          const sectionId = targetElement
            ?.closest("[data-section]")
            ?.getAttribute("data-section");

          websocketService.sendGazeData(data.x, data.y, sectionId);
        }
      });
    } catch (error) {
      console.error("트래킹 시작 실패:", error);
      setCalibrationStatus("needed");
    }
  };

  const handleCalibrationComplete = () => {
    setCalibrationStatus("ready");
    setIsTracking(true);
    startTracking();
  };

  // Calibration이 필요한 경우
  if (calibrationStatus === "needed") {
    return <Calibration onComplete={handleCalibrationComplete} />;
  }

  // 상태 확인 중
  if (calibrationStatus === "checking") {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">시스템 확인 중...</p>
        </div>
      </div>
    );
  }

  // 정상 화면
  window.webgazer.showVideoPreview(false).showPredictionPoints(false);
  return (
    <div className="w-full h-screen flex flex-col relative bg-white">
      {/* 시선 트래커 */}
      {isTracking && (
        <div
          ref={trackerRef}
          className="w-4 h-4 bg-red-500 rounded-full absolute z-50 pointer-events-none border-2 border-white"
          style={{ transform: "translate(-50%, -50%)" }}
        />
      )}

      {/* 상태 표시 */}
      <div className="absolute top-4 right-4 z-50 space-y-2">
        <div
          className={`px-3 py-1 rounded text-sm ${
            isTracking
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isTracking ? "🟢 추적 중" : "🔴 대기 중"}
        </div>

        {/* 재캘리브레이션 버튼 */}
        <button
          onClick={() => setCalibrationStatus("needed")}
          className="block w-full px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
        >
          🔄 재캘리브레이션
        </button>
      </div>

      {/* 메인 컨테이너 - 화면 중앙에 500px 고정 */}
      <div className="w-full max-w-[500px] mx-auto h-screen flex flex-col">
        {/* 헤더 - 10% */}
        <div
          data-section="header"
          className="bg-blue-600 text-white flex items-center justify-center"
          style={{ height: "10vh" }}
        >
          <div className="text-center">
            <h1 className="text-lg font-bold">🏦 신한은행</h1>
            <p className="text-sm">금융상품 가입</p>
          </div>
        </div>

        {/* 투자 위험 고지사항 - 30% */}
        <div
          data-section="risk-warning"
          className="bg-red-50 border-l-4 border-red-400 p-4 flex flex-col justify-center"
          style={{ height: "30vh" }}
        >
          <h3 className="text-lg font-semibold mb-3 text-red-700">
            ⚠️ 투자 위험 고지사항
          </h3>
          <div className="text-sm leading-relaxed space-y-2">
            <p>
              <strong>원금 손실 위험:</strong> 본 금융상품은 원금 손실의 위험이
              있습니다. 투자원금의 전부 또는 일부를 잃을 수 있습니다.
            </p>
            <p>
              <strong>시장 위험:</strong> 주식, 채권, 파생상품 등의 가격
              변동으로 인해 손실이 발생할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 수수료 및 보수 안내 - 30% */}
        <div
          data-section="fee-info"
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex flex-col justify-center"
          style={{ height: "30vh" }}
        >
          <h3 className="text-lg font-semibold mb-3 text-yellow-700">
            💰 수수료 및 보수 안내
          </h3>
          <div className="text-sm leading-relaxed space-y-2">
            <p>
              <strong>판매수수료:</strong> 가입금액의 1.0% (최대 100만원)
            </p>
            <p>
              <strong>연간 관리보수:</strong> 연 1.5% (매일 차감)
            </p>
            <p>
              <strong>성과보수:</strong> 수익 발생 시 초과수익의 20%
            </p>
          </div>
        </div>

        {/* 계약 철회권 및 해지 조건 - 30% */}
        <div
          data-section="withdrawal-right"
          className="bg-blue-50 border-l-4 border-blue-400 p-4 flex flex-col justify-center"
          style={{ height: "30vh" }}
        >
          <h3 className="text-lg font-semibold mb-3 text-blue-700">
            📅 계약 철회권 및 해지 조건
          </h3>
          <div className="text-sm leading-relaxed space-y-2">
            <p>
              <strong>철회 기간:</strong> 계약체결일로부터 14일 이내 (영업일
              기준)
            </p>
            <p>
              <strong>철회 방법:</strong> 서면, 전화, 인터넷 등을 통해 철회 의사
              표시
            </p>
            <p>
              <strong>해지 수수료:</strong> 가입 후 1년 이내 해지 시 0.5% 부과
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
