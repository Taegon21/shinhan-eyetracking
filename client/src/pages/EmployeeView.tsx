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

  const [allPageSections, setAllPageSections] = useState<
    Record<string, Record<string, SectionStatus>>
  >({});

  const [lastActiveSection, setLastActiveSection] = useState<string>("");
  const [pageProgress, setPageProgress] = useState<Record<string, number>>({});

  const [isCustomerActive, setIsCustomerActive] = useState(true);
  const [lastDataTime, setLastDataTime] = useState<number>(Date.now());
  const lastDataRef = useRef(Date.now());
  const sectionStatus = allPageSections[currentPage] || {};

  const initializeCurrentPageSections = (pageKey: string) => {
    if (!allPageSections[pageKey]) {
      const newPageSections = initializePageSections(pageKey);

      setAllPageSections((prev) => ({
        ...prev,
        [pageKey]: newPageSections,
      }));
    }
  };

  const updateSectionData = (sectionId: string, sectionPage: string) => {
    const pageSection = PAGE_SECTIONS[sectionPage]?.find(
      (section) => section.id === sectionId
    );

    if (!pageSection) return;

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

  const handleGazeData = (data: GazeData) => {
    setLastDataTime(Date.now());

    if (data.currentPage && data.currentPage !== currentPage) {
      setCurrentPage(data.currentPage);
    }

    if (data.sectionId) {
      setLastActiveSection(data.sectionId);

      const sectionPage = findPageBySection(data.sectionId);
      if (!sectionPage) {
        return;
      }
      updateSectionData(data.sectionId, sectionPage);
    }
  };

  const handlePageChange = (data: PageChangeData) => {
    setCurrentPage(data.currentPage);
    setLastDataTime(Date.now());
  };

  const handleConnect = () => {
    setConnectionStatus("connected");
  };

  const handleDisconnect = () => {
    setConnectionStatus("disconnected");
  };

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

  useEffect(() => {
    initializeCurrentPageSections(currentPage);
  }, [currentPage, allPageSections]);

  useEffect(() => {
    calculateAllPagesProgress();
  }, [allPageSections]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setIsCustomerActive(now - lastDataRef.current < INACTIVE_THRESHOLD_MS);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // 리스너 설정
    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);
    websocketService.onGazeData(handleGazeData);
    websocketService.onPageChange(handlePageChange);
  }, []);

  const showOverlay = connectionStatus === "disconnected" || !isCustomerActive;

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
