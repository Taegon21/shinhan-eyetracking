/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import {
  websocketService,
  type GazeData,
  type PageChangeData,
} from "../util/WebSocketService";
import { PAGE_NAMES, PAGE_SECTIONS } from "../constant/content";
import {
  type SectionStatus,
  findPageBySection,
  initializePageSections,
  calculatePageProgress,
} from "../util/utilFunction";
import StatusOverlay from "../component/employee/StatusOverlay";
import EmployeeHeader from "../component/employee/EmployeeHeader";
import CurrentPageStatus from "../component/employee/CurrentPageStatus";
import OverallProgress from "../component/employee/OverallProgress";
import SectionProgress from "../component/employee/SectionProgress";

// 비활성 상태 판정: 3초간 데이터 없으면 비활성
const INACTIVE_THRESHOLD_MS = 3000;

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
  const lastDataRef = useRef(Date.now());
  const sectionStatus = allPageSections[currentPage] || {};

  // 페이지 섹션 초기화 함수
  const initializeCurrentPageSections = (pageKey: string) => {
    if (!allPageSections[pageKey]) {
      const newPageSections = initializePageSections(pageKey);

      setAllPageSections((prev) => ({
        ...prev,
        [pageKey]: newPageSections,
      }));

      console.log(`🔄 페이지 섹션 초기화: ${pageKey}`, newPageSections);
    }
  };

  // 섹션 업데이트 함수
  const updateSectionData = (sectionId: string, sectionPage: string) => {
    const pageSection = PAGE_SECTIONS[sectionPage]?.find(
      (section) => section.id === sectionId
    );

    if (!pageSection) return;

    console.log(`📍 섹션 업데이트: ${sectionId} (페이지: ${sectionPage})`);

    setAllPageSections((prev) => {
      const currentPageData = prev[sectionPage] || {};
      const currentSectionData = currentPageData[sectionId] || {
        ...pageSection,
        viewed: false,
        viewTime: 0,
        lastViewTime: 0,
      };

      return {
        ...prev,
        [sectionPage]: {
          ...currentPageData,
          [sectionId]: {
            ...currentSectionData,
            viewed: true,
            viewTime: currentSectionData.viewTime + 0.1,
            lastViewTime: Date.now(),
          },
        },
      };
    });
  };

  // 시선 데이터 처리 함수
  const handleGazeData = (data: GazeData) => {
    setLastDataTime(Date.now());

    // 페이지 변경 처리
    if (data.currentPage && data.currentPage !== currentPage) {
      setCurrentPage(data.currentPage);
    }

    // 섹션 데이터 처리
    if (data.sectionId) {
      setLastActiveSection(data.sectionId);

      const sectionPage = findPageBySection(data.sectionId);
      if (!sectionPage) {
        return;
      }
      updateSectionData(data.sectionId, sectionPage);
    }
  };

  // 페이지 변경 처리 함수
  const handlePageChange = (data: PageChangeData) => {
    setCurrentPage(data.currentPage);
    setLastDataTime(Date.now());
  };

  // 연결 상태 처리 함수들
  const handleConnect = () => {
    setConnectionStatus("connected");
    console.log("✅ WebSocket 연결됨");
  };

  const handleDisconnect = () => {
    setConnectionStatus("disconnected");
    console.log("❌ WebSocket 연결 끊김");
  };

  // 전체 진행률 계산 함수
  const calculateAllPagesProgress = () => {
    Object.keys(PAGE_SECTIONS).forEach((pageKey) => {
      const pageSections = PAGE_SECTIONS[pageKey];
      const pageStatus = allPageSections[pageKey] || {};
      const progress = calculatePageProgress(pageSections, pageStatus);

      setPageProgress((prev) => ({
        ...prev,
        [pageKey]: progress,
      }));
    });
  };

  useEffect(() => {
    lastDataRef.current = lastDataTime;
  }, [lastDataTime]);

  // 페이지가 변경될 때 해당 페이지의 섹션 초기화
  useEffect(() => {
    initializeCurrentPageSections(currentPage);
  }, [currentPage, allPageSections]);

  // 모든 페이지의 진행률 계산
  useEffect(() => {
    calculateAllPagesProgress();
  }, [allPageSections]);

  // ✅ 고객 활동 상태 모니터링 - 한 번만 생성되는 인터벌
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setIsCustomerActive(now - lastDataRef.current < INACTIVE_THRESHOLD_MS);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket 연결 및 리스너 설정
  useEffect(() => {
    // 리스너 설정
    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);
    websocketService.onGazeData(handleGazeData);
    websocketService.onPageChange(handlePageChange);
  }, []);

  // 오버레이 표시 조건
  const showOverlay = connectionStatus === "disconnected" || !isCustomerActive;

  console.log("👁️ 오버레이 표시:", showOverlay);
  console.log("고객상태", isCustomerActive);

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      <StatusOverlay
        showOverlay={showOverlay}
        connectionStatus={connectionStatus}
        onReconnect={() => {
          websocketService.connect();
        }}
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
