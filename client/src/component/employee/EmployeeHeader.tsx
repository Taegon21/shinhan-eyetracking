interface EmployeeHeaderProps {
  isCustomerActive: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
}

export default function EmployeeHeader({
  isCustomerActive,
  connectionStatus,
}: EmployeeHeaderProps) {
  return (
    <div className="bg-gray-800 text-white p-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">👨‍💼 직원 모니터링 시스템</h1>
        <div className="flex items-center space-x-4">
          {/* 고객 활동 상태 표시 */}
          <div
            className={`px-3 py-1 rounded-full text-sm ${
              isCustomerActive
                ? "bg-green-600 text-white"
                : "bg-orange-600 text-white animate-pulse"
            }`}
          >
            {isCustomerActive ? "👀 고객 활성" : `😴 비활성`}
          </div>

          {/* 연결 상태 표시 */}
          <div
            className={`px-3 py-1 rounded-full text-sm ${
              connectionStatus === "connected"
                ? "bg-green-600 text-white"
                : connectionStatus === "connecting"
                  ? "bg-yellow-600 text-white"
                  : "bg-red-600 text-white animate-pulse"
            }`}
          >
            {connectionStatus === "connected"
              ? "🟢 연결됨"
              : connectionStatus === "connecting"
                ? "🟡 연결 중..."
                : "🔴 연결 끊김"}
          </div>
        </div>
      </div>
    </div>
  );
}
