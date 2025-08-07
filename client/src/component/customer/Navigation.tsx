export default function Navigation({
  currentPage,
  onPrevPage,
  onNextPage,
}: {
  currentPage: string;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  const isFirstPage = currentPage === "productJoin";
  const isLastPage = currentPage === "productComparison";

  return (
    <div className="flex justify-between items-center p-4 bg-gray-50">
      <button
        onClick={onPrevPage}
        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
          isFirstPage
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
        }`}
        disabled={isFirstPage}
        title={isFirstPage ? "첫 페이지입니다" : "이전 페이지로"}
      >
        <span className="mr-2">←</span>
        이전
      </button>

      <div className="flex space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            currentPage === "productJoin" ? "bg-blue-600" : "bg-gray-300"
          }`}
        />
        <div
          className={`w-3 h-3 rounded-full ${
            currentPage === "productDetail" ? "bg-blue-600" : "bg-gray-300"
          }`}
        />
        <div
          className={`w-3 h-3 rounded-full ${
            currentPage === "productComparison" ? "bg-blue-600" : "bg-gray-300"
          }`}
        />
      </div>

      <button
        onClick={onNextPage}
        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
          isLastPage
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
        }`}
        disabled={isLastPage}
        title={isLastPage ? "마지막 페이지입니다" : "다음 페이지로"}
      >
        다음
        <span className="ml-2">→</span>
      </button>
    </div>
  );
}
