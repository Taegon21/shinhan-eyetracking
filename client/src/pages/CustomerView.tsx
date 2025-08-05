import { useEffect, useRef, useState } from "react";
import { websocketService, type GazeData } from "../util/WebSocketService";

import Calibration from "../component/Calibration";
import SectionCard from "../component/SectionCard";
import StatusPanel from "../component/StatusPanel";
import SystemChecking from "../component/SystemChecking";
import { domUtils, webgazerUtils } from "../util/utilFunction";

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

    // WebGazer 상태 확인
    const checkCalibration = () => {
      if (webgazerUtils.isWebGazerReady()) {
        console.log("✅ WebGazer 이미 준비됨 - 트래킹 시작");
        startTracking();
      } else {
        console.log("❌ Calibration 필요");
        setCalibrationStatus("needed");
      }
    };

    const timer = setTimeout(checkCalibration, 500);
    return () => clearTimeout(timer);
  }, []);

  const startTracking = () => {
    try {
      setIsTracking(true);
      setCalibrationStatus("ready");

      webgazerUtils.startGazeTracking((data: GazeData) => {
        if (data) {
          // 트래커 위치 업데이트
          domUtils.updateTrackerPosition(trackerRef.current, data.x, data.y);

          // 섹션 ID 추출
          const sectionId = domUtils.getSectionIdFromPoint(data.x, data.y);

          // 웹소켓으로 데이터 전송
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

  const handleRecalibrate = () => {
    setIsTracking(false);
    setCalibrationStatus("needed");
    webgazerUtils.stopGazeTracking();
  };

  // Calibration이 필요한 경우
  if (calibrationStatus === "needed") {
    return <Calibration onComplete={handleCalibrationComplete} />;
  }

  // 상태 확인 중
  if (calibrationStatus === "checking") {
    return <SystemChecking />;
  }

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
      <StatusPanel isTracking={isTracking} onRecalibrate={handleRecalibrate} />

      <div className="w-full max-w-[500px] mx-auto h-screen flex flex-col">
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

        <SectionCard
          sectionId="risk-warning"
          title="⚠️ 투자 위험 고지사항"
          bgColor="bg-red-50"
          borderColor="border-red-400"
          titleColor="text-red-700"
        >
          <p>
            <strong>원금 손실 위험:</strong> 본 금융상품은 원금 손실의 위험이
            있습니다. 투자원금의 전부 또는 일부를 잃을 수 있습니다.
          </p>
          <p>
            <strong>시장 위험:</strong> 주식, 채권, 파생상품 등의 가격 변동으로
            인해 손실이 발생할 수 있습니다.
          </p>
        </SectionCard>

        <SectionCard
          sectionId="fee-info"
          title="💰 수수료 및 보수 안내"
          bgColor="bg-yellow-50"
          borderColor="border-yellow-400"
          titleColor="text-yellow-700"
        >
          <p>
            <strong>판매수수료:</strong> 가입금액의 1.0% (최대 100만원)
          </p>
          <p>
            <strong>연간 관리보수:</strong> 연 1.5% (매일 차감)
          </p>
          <p>
            <strong>성과보수:</strong> 수익 발생 시 초과수익의 20%
          </p>
        </SectionCard>

        <SectionCard
          sectionId="withdrawal-right"
          title="📅 계약 철회권 및 해지 조건"
          bgColor="bg-blue-50"
          borderColor="border-blue-400"
          titleColor="text-blue-700"
        >
          <p>
            <strong>철회 기간:</strong> 계약체결일로부터 14일 이내 (영업일 기준)
          </p>
          <p>
            <strong>철회 방법:</strong> 서면, 전화, 인터넷 등을 통해 철회 의사
            표시
          </p>
          <p>
            <strong>해지 수수료:</strong> 가입 후 1년 이내 해지 시 0.5% 부과
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
