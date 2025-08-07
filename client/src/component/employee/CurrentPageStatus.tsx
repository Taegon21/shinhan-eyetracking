interface CurrentPageStatusProps {
  currentPage: string;
  pageNames: Record<string, string>;
  pageProgress: Record<string, number>;
}

export default function CurrentPageStatus({
  currentPage,
  pageNames,
  pageProgress,
}: CurrentPageStatusProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">📱 현재 고객 화면</h2>
          <p className="text-2xl font-bold text-blue-600">
            {pageNames[currentPage] || currentPage}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">페이지 진행률</p>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pageProgress[currentPage] || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {Math.round(pageProgress[currentPage] || 0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
