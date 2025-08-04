import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { websocketService, type GazeData } from "../util/WebSocketService";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webgazer: any;
  }
}

export default function CustomerView() {
  const navigate = useNavigate();
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

  // Calibration이 필요한 경우
  if (calibrationStatus === "needed") {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">🎯 캘리브레이션 필요</h1>
          <p className="text-gray-600 mb-6">
            아이트래킹을 사용하기 전에 먼저 캘리브레이션을 완료해주세요.
          </p>
          <button
            onClick={() => navigate("/calibration")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            캘리브레이션 페이지로 이동
          </button>
        </div>
      </div>
    );
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
  return (
    <div className="w-full min-h-screen relative bg-white">
      {/* 시선 트래커 */}
      {isTracking && (
        <div
          ref={trackerRef}
          className="w-4 h-4 bg-red-500 rounded-full absolute z-50 pointer-events-none border-2 border-white"
          style={{ transform: "translate(-50%, -50%)" }}
        />
      )}

      {/* 상태 표시 */}
      <div className="absolute top-4 right-4 z-50">
        <div
          className={`px-3 py-1 rounded text-sm ${
            isTracking
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isTracking ? "🟢 추적 중" : "🔴 대기 중"}
        </div>
      </div>

      {/* 헤더 */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">🏦 신한은행 금융상품 가입</h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
          >
            ← 돌아가기
          </button>
        </div>
      </div>

      {/* 약관 내용 */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">
            📋 금융상품 설명서 및 약관
          </h2>
          <p className="text-gray-600 text-lg">
            아래 내용을 천천히 읽어보시고, 이해가 되지 않는 부분은 언제든 문의해
            주세요.
          </p>
        </div>

        {/* 기존 약관 섹션들 그대로 유지 */}
        <div
          data-section="risk-warning"
          className="bg-red-50 border-l-4 border-red-400 p-8 mb-6 rounded"
        >
          <h3 className="text-2xl font-semibold mb-4 text-red-700">
            ⚠️ 투자 위험 고지사항
          </h3>
          <div className="text-lg leading-relaxed space-y-4">
            <p>
              <strong>원금 손실 위험:</strong> 본 금융상품은 원금 손실의 위험이
              있습니다. 투자원금의 전부 또는 일부를 잃을 수 있으며,
              예금자보호법에 따른 예금보험공사의 보호 대상이 아닙니다.
            </p>
            <p>
              <strong>시장 위험:</strong> 주식, 채권, 파생상품 등의 가격
              변동으로 인해 손실이 발생할 수 있습니다. 과거의 운용실적이 미래의
              수익률을 보장하지 않습니다.
            </p>
          </div>
        </div>

        <div
          data-section="fee-info"
          className="bg-yellow-50 border-l-4 border-yellow-400 p-8 mb-6 rounded"
        >
          <h3 className="text-2xl font-semibold mb-4 text-yellow-700">
            💰 수수료 및 보수 안내
          </h3>
          <div className="text-lg leading-relaxed space-y-4">
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

        <div
          data-section="withdrawal-right"
          className="bg-blue-50 border-l-4 border-blue-400 p-8 mb-6 rounded"
        >
          <h3 className="text-2xl font-semibold mb-4 text-blue-700">
            📅 계약 철회권 및 해지 조건
          </h3>
          <div className="text-lg leading-relaxed space-y-4">
            <p>
              <strong>철회 기간:</strong> 계약체결일로부터 14일 이내 (영업일
              기준)
            </p>
            <p>
              <strong>철회 방법:</strong> 서면, 전화, 인터넷 등을 통해 철회 의사
              표시
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
