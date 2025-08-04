import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface GazeData {
  x: number;
  y: number;
  timestamp: number;
  sectionId?: string | null;
}

interface SectionStatus {
  name: string;
  viewed: boolean;
  viewTime: number;
  required: number;
  color: string;
}

export default function EmployeeView() {
  const navigate = useNavigate();
  const [currentGaze, setCurrentGaze] = useState<GazeData | null>(null);
  const [sectionStatus, setSectionStatus] = useState<
    Record<string, SectionStatus>
  >({
    "risk-warning": {
      name: "위험 고지사항",
      viewed: false,
      viewTime: 0,
      required: 10,
      color: "border-red-400",
    },
    "fee-info": {
      name: "수수료 안내",
      viewed: false,
      viewTime: 0,
      required: 8,
      color: "border-yellow-400",
    },
    "withdrawal-right": {
      name: "계약 철회권",
      viewed: false,
      viewTime: 0,
      required: 6,
      color: "border-blue-400",
    },
  });

  const [allSectionsComplete, setAllSectionsComplete] = useState(false);
  const [lastActiveSection, setLastActiveSection] = useState<string>("");

  useEffect(() => {
    // WebSocket으로 시선 데이터 수신 (여기서는 시뮬레이션)
    const interval = setInterval(() => {
      // 실제로는 websocketService.onGazeData()로 받아옴
      // 여기서는 테스트용 시뮬레이션
      const mockGazeData: GazeData = {
        x: Math.random() * 1200,
        y: Math.random() * 800,
        sectionId:
          Math.random() > 0.7
            ? Object.keys(sectionStatus)[Math.floor(Math.random() * 3)]
            : undefined,
        timestamp: Date.now(),
      };

      setCurrentGaze(mockGazeData);

      if (mockGazeData.sectionId) {
        setLastActiveSection(mockGazeData.sectionId);
        setSectionStatus((prev) => ({
          ...prev,
          [mockGazeData.sectionId!]: {
            ...prev[mockGazeData.sectionId!],
            viewed: true,
            viewTime: prev[mockGazeData.sectionId!].viewTime + 0.1,
          },
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const complete = Object.values(sectionStatus).every(
      (section) => section.viewTime >= section.required
    );
    setAllSectionsComplete(complete);
  }, [sectionStatus]);

  return (
    <div className="w-full h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">👨‍💼 직원 모니터링 시스템</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => window.open("/customer", "_blank")}
              className="px-4 py-2 bg-blue-600 rounded"
            >
              👤 고객 화면 열기
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-600 rounded"
            >
              ← 돌아가기
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 전체 상태 알림 */}
        <div
          className={`p-6 rounded-lg mb-6 text-center ${
            allSectionsComplete
              ? "bg-green-100 border-2 border-green-400"
              : "bg-yellow-100 border-2 border-yellow-400"
          }`}
        >
          {allSectionsComplete ? (
            <div>
              <h2 className="text-2xl font-bold text-green-800">
                🎉 약관 확인 완료!
              </h2>
              <p className="text-green-700 text-lg">
                고객이 모든 중요 약관을 충분히 확인했습니다. 계약 진행이
                가능합니다.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-yellow-800">
                ⏳ 약관 확인 진행 중
              </h2>
              <p className="text-yellow-700 text-lg">
                고객이 중요 약관을 확인하고 있습니다. 완료까지 기다려 주세요.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 실시간 시선 데이터 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">📍 실시간 시선 추적</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>현재 위치:</span>
                <span className="font-mono">
                  X: {currentGaze?.x.toFixed(0) || 0}, Y:{" "}
                  {currentGaze?.y.toFixed(0) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>활성 섹션:</span>
                <span
                  className={`px-2 py-1 rounded ${
                    lastActiveSection
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {lastActiveSection
                    ? sectionStatus[lastActiveSection]?.name
                    : "없음"}
                </span>
              </div>
            </div>
          </div>

          {/* 약관별 확인 상태 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">
              ✅ 약관 확인 진행 상황
            </h3>
            <div className="space-y-4">
              {Object.entries(sectionStatus).map(([key, section]) => {
                const progress = Math.min(
                  (section.viewTime / section.required) * 100,
                  100
                );
                const isComplete = section.viewTime >= section.required;

                return (
                  <div
                    key={key}
                    className={`p-4 border-l-4 rounded ${section.color} ${
                      isComplete ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{section.name}</span>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          isComplete
                            ? "bg-green-200 text-green-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isComplete ? "완료" : "진행중"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>확인 시간: {section.viewTime.toFixed(1)}초</span>
                      <span>필요 시간: {section.required}초</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isComplete ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 고객 화면 미러링 (iframe) */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-xl font-semibold mb-4">🖥️ 고객 화면 미러링</h3>
          <div className="border-2 border-gray-300 rounded">
            <iframe
              src="/customer"
              className="w-full h-96 rounded"
              title="고객 화면 미러링"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            * 실제 환경에서는 고객 태블릿 화면이 실시간으로 미러링됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
