import type { SectionInfo } from "../../constant/content";

interface SectionStatus extends SectionInfo {
  viewed: boolean;
  viewTime: number;
  lastViewTime: number;
}

interface SectionProgressProps {
  currentPageName: string;
  sectionStatus: Record<string, SectionStatus>;
  lastActiveSection: string;
}

export default function SectionProgress({
  currentPageName,
  sectionStatus,
  lastActiveSection,
}: SectionProgressProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">
        ✅ {currentPageName} 확인 진행 상황
      </h3>
      <div className="space-y-4">
        {Object.entries(sectionStatus).map(([key, section]) => {
          const progress = Math.min(
            (section.viewTime / section.required) * 100,
            100
          );
          const isComplete = section.viewTime >= section.required;
          const isActive = lastActiveSection === key;

          return (
            <div
              key={key}
              className={`p-4 border-l-4 rounded transition-all duration-200 ${
                section.borderColor
              } ${
                isComplete
                  ? "bg-green-50"
                  : isActive
                    ? "bg-blue-50"
                    : "bg-gray-50"
              } ${isActive ? "ring-2 ring-blue-300" : ""}`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{section.name}</span>
                  {section.priority === "high" && (
                    <span className="px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                      필수
                    </span>
                  )}
                  {isActive && (
                    <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded animate-pulse">
                      시청중
                    </span>
                  )}
                </div>
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
                    isComplete
                      ? "bg-green-500"
                      : isActive
                        ? "bg-blue-500"
                        : "bg-gray-400"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
