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

  // 모든 페이지의 섹션 상태를 저장
  const [allPageSections, setAllPageSections] = useState<
    Record<string, Record<string, SectionStatus>>
  >({});

  const [lastActiveSection, setLastActiveSection] = useState<string>("");
  const [pageProgress, setPageProgress] = useState<Record<string, number>>({});

  // 고객 활동 상태 추가
  const [isCustomerActive, setIsCustomerActive] = useState(true);
  const [lastDataTime, setLastDataTime] = useState<number>(Date.now());

  // 현재 페이지의 섹션 상태 계산 (computed value)
  const sectionStatus = allPageSections[currentPage] || {};

  // 페이지가 변경될 때 해당 페이지의 섹션 초기화
  useEffect(() => {
    const currentSections = PAGE_SECTIONS[currentPage] || [];

    // 현재 페이지의 섹션이 allPageSections에 없으면 초기화
    if (!allPageSections[currentPage]) {
      const newPageSections: Record<string, SectionStatus> = {};

      currentSections.forEach((section) => {
        newPageSections[section.id] = {
          ...section,
          viewed: false,
          viewTime: 0,
          lastViewTime: 0,
        };
      });

      setAllPageSections((prev) => ({
        ...prev,
        [currentPage]: newPageSections,
      }));

      console.log(`🔄 페이지 섹션 초기화: ${currentPage}`, newPageSections);
    }
  }, [currentPage, allPageSections]);

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
      console.log("👁️ 시선 데이터 수신:", data);
      setLastDataTime(Date.now());

      if (data.currentPage && data.currentPage !== currentPage) {
        console.log(`📄 페이지 변경: ${currentPage} → ${data.currentPage}`);
        setCurrentPage(data.currentPage);
      }

      if (data.sectionId) {
        setLastActiveSection(data.sectionId);

        const sectionPage = findPageBySection(data.sectionId!);
        if (sectionPage) {
          const pageSection = PAGE_SECTIONS[sectionPage]?.find(
            (section) => section.id === data.sectionId
          );

          if (pageSection) {
            console.log(
              `📍 섹션 업데이트: ${data.sectionId} (페이지: ${sectionPage})`
            );

            setAllPageSections((prev) => {
              const currentPageData = prev[sectionPage] || {};
              const currentSectionData = currentPageData[data.sectionId!] || {
                ...pageSection,
                viewed: false,
                viewTime: 0,
                lastViewTime: 0,
              };

              return {
                ...prev,
                [sectionPage]: {
                  ...currentPageData,
                  [data.sectionId!]: {
                    ...currentSectionData,
                    viewed: true,
                    viewTime: currentSectionData.viewTime + 0.1,
                    lastViewTime: Date.now(),
                  },
                },
              };
            });
          }
        } else {
          console.warn(`⚠️ 존재하지 않는 섹션: ${data.sectionId}`);
        }
      }
    });

    // 페이지 변경 리스너
    websocketService.onPageChange((data: PageChangeData) => {
      console.log(`📄 페이지 변경 수신: ${data.currentPage}`);
      setCurrentPage(data.currentPage);
      setLastDataTime(Date.now());
    });

    return () => {
      websocketService.disconnect();
    };
  }, []); // 의존성 배열을 빈 배열로 변경

  // 모든 페이지의 진행률 계산
  useEffect(() => {
    Object.keys(PAGE_SECTIONS).forEach((pageKey) => {
      const pageSections = PAGE_SECTIONS[pageKey];
      const pageStatus = allPageSections[pageKey] || {};

      if (pageSections.length > 0) {
        const progress =
          pageSections.reduce((acc, section) => {
            const sectionData = pageStatus[section.id];
            const sectionProgress = sectionData
              ? Math.min(
                  (sectionData.viewTime / sectionData.required) * 100,
                  100
                )
              : 0;
            return acc + sectionProgress;
          }, 0) / pageSections.length;

        setPageProgress((prev) => ({
          ...prev,
          [pageKey]: progress,
        }));
      }
    });
  }, [allPageSections]);

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

// 섹션이 속한 페이지를 찾는 헬퍼 함수
const findPageBySection = (sectionId: string): string | null => {
  for (const [pageKey, sections] of Object.entries(PAGE_SECTIONS)) {
    if (sections.some((section) => section.id === sectionId)) {
      return pageKey;
    }
  }
  return null;
};
