interface StatusPanelProps {
  isTracking: boolean;
  onRecalibrate: () => void;
}

export default function StatusPanel({
  isTracking,
  onRecalibrate,
}: StatusPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-50 space-y-2">
      <div
        className={`px-3 py-1 rounded text-sm ${
          isTracking ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isTracking ? "🟢 추적 중" : "🔴 대기 중"}
      </div>

      <button
        onClick={onRecalibrate}
        className="block w-full px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
      >
        🔄 재캘리브레이션
      </button>
    </div>
  );
}
