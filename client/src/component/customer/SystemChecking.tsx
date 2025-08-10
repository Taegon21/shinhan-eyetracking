export default function SystemChecking() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">시스템 확인 중...</p>
        {/* // 시스템 연결 혹은 소켓 연결 상태를 확인해주세요 */}
        <p className="text-gray-500 text-sm mt-2">
          시스템 연결 혹은 소켓 연결 상태를 확인해주세요
        </p>
      </div>
    </div>
  );
}
