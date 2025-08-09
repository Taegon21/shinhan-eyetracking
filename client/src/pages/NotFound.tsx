import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            페이지를 찾을 수 없습니다
          </h2>
        </div>

        <div className="space-y-4 w-full flex flex-col">
          <Link
            to="/customer"
            className="w-full bg-gray-300 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            고객 페이지로 이동하기
          </Link>

          <Link
            to="/employee"
            className="w-full bg-gray-300 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            관리자 페이지로 이동하기
          </Link>
        </div>
      </div>
    </div>
  );
}
