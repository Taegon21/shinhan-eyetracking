import { useEffect, useState } from "react";
import {
  websocketService,
  type GazeData,
  type PageChangeData,
} from "../util/WebSocketService";
import {
  PAGE_NAMES,
  PAGE_SECTIONS,
  type SectionInfo,
} from "../constant/content";

import StatusOverlay from "../component/employee/StatusOverlay";
import EmployeeHeader from "../component/employee/EmployeeHeader";
import CurrentPageStatus from "../component/employee/CurrentPageStatus";
import OverallProgress from "../component/employee/OverallProgress";
import SectionProgress from "../component/employee/SectionProgress";

interface SectionStatus extends SectionInfo {
  viewed: boolean;
  viewTime: number;
  lastViewTime: number;
}

export default function EmployeeView() {
  const [currentPage, setCurrentPage] = useState<string>("productJoin");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [sectionStatus, setSectionStatus] = useState<
    Record<string, SectionStatus>
  >({});

  const [lastActiveSection, setLastActiveSection] = useState<string>("");
  const [pageProgress, setPageProgress] = useState<Record<string, number>>({});

  // 고객 활동 상태 추가
  const [isCustomerActive, setIsCustomerActive] = useState(true);
  const [lastDataTime, setLastDataTime] = useState<number>(Date.now());

  // 현재 페이지의 섹션으로 sectionStatus 초기화
  useEffect(() => {
    const currentSections = PAGE_SECTIONS[currentPage] || [];
    const newStatus: Record<string, SectionStatus> = {};

    currentSections.forEach((section) => {
      newStatus[section.id] = {
        ...section,
        viewed: false,
        viewTime: 0,
        lastViewTime: 0,
      };
    });

    setSectionStatus(newStatus);
  }, [currentPage]);

  // 고객 활동 상태 모니터링
  useEffect(() => {
    const checkActivity = setInterval(() => {
      const now = Date.now();
      const timeSinceLastData = (now - lastDataTime) / 1000;

      if (timeSinceLastData >= 3) {
        setIsCustomerActive(false);
      } else {
        setIsCustomerActive(true);
      }
    }, 1000);

    return () => clearInterval(checkActivity);
  }, [lastDataTime]);

  useEffect(() => {
    // WebSocket 연결
    websocketService.connect();

    // 연결 상태 리스너
    websocketService.onConnect(() => {
      setConnectionStatus("connected");
      console.log("✅ WebSocket 연결됨");
    });

    websocketService.onDisconnect(() => {
      setConnectionStatus("disconnected");
      console.log("❌ WebSocket 연결 끊김");
    });

    // 시선 데이터 리스너
    websocketService.onGazeData((data: GazeData) => {
      setLastDataTime(Date.now()); // 데이터 수신 시간 업데이트

      if (data.currentPage && data.currentPage !== currentPage) {
        setCurrentPage(data.currentPage);
      }

      if (data.sectionId) {
        setLastActiveSection(data.sectionId);
        setSectionStatus((prev) => ({
          ...prev,
          [data.sectionId!]: {
            ...prev[data.sectionId!],
            viewed: true,
            viewTime: prev[data.sectionId!]?.viewTime + 0.1 || 0.1,
            lastViewTime: Date.now(),
          },
        }));
      }
    });

    // 페이지 변경 리스너
    websocketService.onPageChange((data: PageChangeData) => {
      setCurrentPage(data.currentPage);
      setLastDataTime(Date.now()); // 페이지 변경도 활동으로 간주
      console.log(
        `📄 페이지 변경: ${PAGE_NAMES[data.currentPage] || data.currentPage}`
      );
    });

    return () => {
      websocketService.disconnect();
    };
  }, [currentPage]);

  // 완료 상태 체크
  useEffect(() => {
    const currentSections = Object.values(sectionStatus);

    // 페이지별 진행률 계산
    const progress =
      currentSections.length > 0
        ? currentSections.reduce(
            (acc, section) =>
              acc + Math.min((section.viewTime / section.required) * 100, 100),
            0
          ) / currentSections.length
        : 0;

    setPageProgress((prev) => ({
      ...prev,
      [currentPage]: progress,
    }));
  }, [sectionStatus, currentPage]);

  // 오버레이 표시 조건
  const showOverlay = connectionStatus === "disconnected" || !isCustomerActive;

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      <StatusOverlay
        showOverlay={showOverlay}
        connectionStatus={connectionStatus}
        onReconnect={() => websocketService.connect()}
      />

      <EmployeeHeader
        isCustomerActive={isCustomerActive}
        connectionStatus={connectionStatus}
      />

      <div className="max-w-7xl mx-auto p-6">
        <CurrentPageStatus
          currentPage={currentPage}
          pageNames={PAGE_NAMES}
          pageProgress={pageProgress}
        />

        <SectionProgress
          currentPageName={PAGE_NAMES[currentPage]}
          sectionStatus={sectionStatus}
          lastActiveSection={lastActiveSection}
        />
        <OverallProgress
          pageNames={PAGE_NAMES}
          pageProgress={pageProgress}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}
