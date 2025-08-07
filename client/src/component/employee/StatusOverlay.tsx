interface StatusOverlayProps {
  showOverlay: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
  onReconnect: () => void;
}

export default function StatusOverlay({
  showOverlay,
  connectionStatus,
  onReconnect,
}: StatusOverlayProps) {
  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 bg-gray-200/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-lg mx-4 text-center border-2 border-gray-300">
        {connectionStatus === "disconnected" ? (
          // 연결 끊김 상태
          <div>
            <div className="text-8xl mb-4">🔌</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">
              연결이 끊어졌습니다
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              고객 시선 추적 시스템과의
              <br />
              연결이 중단되었습니다.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 font-semibold">💡 확인 사항</p>
              <ul className="text-red-600 text-sm mt-2 text-left">
                <li>• 고객 태블릿의 인터넷 연결 확인</li>
                <li>• 시선 추적 장비 연결 상태 확인</li>
                <li>• 서버 상태 확인</li>
              </ul>
            </div>
            <button
              onClick={onReconnect}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              🔄 재연결 시도
            </button>
          </div>
        ) : (
          // 고객 비활성 상태
          <div>
            <div className="text-8xl mb-4">😴</div>
            <h2 className="text-3xl font-bold text-orange-600 mb-4">
              고객이 화면을 보지 않고 있습니다
            </h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-orange-700 font-semibold">🎯 권장 조치사항</p>
              <ul className="text-orange-600 text-sm mt-2 text-left">
                <li>• 고객에게 화면 집중을 요청</li>
                <li>• 시선 추적 장비 위치 확인</li>
                <li>• 고객의 자세 교정 도움</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
