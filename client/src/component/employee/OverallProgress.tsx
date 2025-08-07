interface OverallProgressProps {
  pageNames: Record<string, string>;
  pageProgress: Record<string, number>;
  currentPage: string;
}

export default function OverallProgress({
  pageNames,
  pageProgress,
  currentPage,
}: OverallProgressProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <h3 className="text-xl font-semibold mb-4">📊 전체 진행 상황</h3>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(pageNames).map(([pageKey, pageName]) => (
          <div
            key={pageKey}
            className={`p-4 rounded-lg border-2 ${
              pageKey === currentPage
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="text-center">
              <h4 className="font-medium mb-2">{pageName}</h4>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    pageKey === currentPage ? "bg-blue-500" : "bg-gray-400"
                  }`}
                  style={{ width: `${pageProgress[pageKey] || 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {Math.round(pageProgress[pageKey] || 0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
