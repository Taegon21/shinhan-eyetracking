/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { websocketService, type GazeData } from "../util/WebSocketService";

import Calibration from "../component/customer/Calibration";
import SectionCard from "../component/customer/SectionCard";
import StatusPanel from "../component/customer/StatusPanel";
import SystemChecking from "../component/customer/SystemChecking";
import { domUtils, webgazerUtils } from "../util/utilFunction";
import { PAGE_CONTENTS, type PageType } from "../constant/content";
import Navigation from "../component/customer/Navigation";

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
  const [currentPage, setCurrentPage] = useState<PageType>("productJoin");

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
          domUtils.updateTrackerPosition(trackerRef.current, data.x, data.y);

          const sectionId = domUtils.getSectionIdFromPoint(data.x, data.y);

          websocketService.sendGazeData(data.x, data.y, sectionId, currentPage);
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

  const handleNextPage = () => {
    let nextPage: PageType = currentPage;

    if (currentPage === "productJoin") {
      nextPage = "productDetail";
    } else if (currentPage === "productDetail") {
      nextPage = "productComparison";
    }

    setCurrentPage(nextPage);
    websocketService.sendPageChange(nextPage);
  };

  const handlePrevPage = () => {
    let prevPage: PageType = currentPage;

    if (currentPage === "productComparison") {
      prevPage = "productDetail";
    } else if (currentPage === "productDetail") {
      prevPage = "productJoin";
    }

    setCurrentPage(prevPage);
    websocketService.sendPageChange(prevPage);
  };

  useEffect(() => {
    websocketService.sendPageChange(currentPage);
  }, [currentPage]);

  if (calibrationStatus === "needed") {
    return <Calibration onComplete={handleCalibrationComplete} />;
  }

  if (calibrationStatus === "checking") {
    return <SystemChecking />;
  }

  const pageData = PAGE_CONTENTS[currentPage];

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
        {/* 헤더 */}
        <div
          data-section="header"
          className="bg-blue-600 text-white flex items-center justify-center"
          style={{ height: "10vh" }}
        >
          <div className="text-center">
            <h1 className="text-lg font-bold">{pageData.header.title}</h1>
            <p className="text-sm">{pageData.header.subtitle}</p>
          </div>
        </div>

        {/* 섹션들 */}
        {pageData.sections.map((section) => (
          <SectionCard
            key={section.id}
            sectionId={section.id}
            title={section.title}
            bgColor={section.bgColor}
            borderColor={section.borderColor}
            titleColor={section.titleColor}
          >
            {section.content.map((item, index) => (
              <p key={index}>
                <strong>{item.label}</strong> {item.text}
              </p>
            ))}
          </SectionCard>
        ))}

        {/* 네비게이션 버튼 */}
        <Navigation
          currentPage={currentPage}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      </div>
    </div>
  );
}
