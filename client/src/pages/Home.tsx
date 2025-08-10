import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function Home() {
  const eyeRef = useRef<HTMLDivElement>(null);

  // 눈알 하나만, 속도 더 빠르게
  useEffect(() => {
    let animationFrame: number;
    let x = Math.random() * 100;
    let y = Math.random() * 100;
    let dx = 2 + Math.random() * 2.5; // 속도 증가
    let dy = 2 + Math.random() * 2.5;
    const moveEye = () => {
      const eye = eyeRef.current;
      if (!eye) return;
      const parent = eye.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const size = 64;
      x += dx;
      y += dy;
      if (x < 0 || x > parentRect.width - size) dx *= -1;
      if (y < 0 || y > parentRect.height - size) dy *= -1;
      eye.style.transform = `translate(${x}px, ${y}px)`;
      animationFrame = requestAnimationFrame(moveEye);
    };
    moveEye();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col justify-center items-center px-6">
      <div className="max-w-[500px] w-full text-center relative overflow-hidden">
        <div
          ref={eyeRef}
          className="w-16 h-16 rounded-full bg-blue-100/30 flex items-center justify-center shadow absolute left-0 top-0 z-10 transition-transform duration-200"
          style={{ pointerEvents: "none", border: "none" }}
        >
          <span className="text-3xl text-blue-600/50 font-extrabold select-none">
            👁️
          </span>
        </div>
        <div className="flex flex-col items-center mb-6 relative z-20">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-2 tracking-tight">
            Eyeproof
          </h1>
        </div>
        <p className="text-gray-700 text-base mb-10 leading-relaxed relative z-20">
          <strong>Eyeproof</strong>는 금소법 제19조에서 규정하는{" "}
          <em className="text-blue-600 font-semibold">설명의무 이행 여부</em>를
          보다 명확하게 입증하기 위해 개발된 프로젝트입니다.
          <br />
          <br />
          금융상품 가입 과정에서 고객이 약관을 읽는 동안{" "}
          <span className="font-semibold text-blue-500">
            시선 추적(Eye-Tracking)
          </span>
          기술로 시선 위치와 머문 시간을 수집·분석하고, 이를 실시간으로
          모니터링합니다.
          <br />
          <br />
          이를 통해 기존의 ‘고객이 설명을 듣고 서명했다’는 수준을 넘어, ‘고객이
          핵심 내용을 실제로 읽고 인지했다’는 내용을 데이터를 기반으로
          풀어나가며, 고객의 이해도에 대한 객관적 지표를 제공함과 동시에,
          금융기관이 설명의무 이행 여부를 보다 명확하게 증명할 수 있도록
          지원합니다.
        </p>

        <div className="space-y-4 w-full flex flex-col mt-12">
          <Link
            to="/customer"
            className="w-full bg-blue-600 hover:bg-blue-700  font-semibold py-3 px-4 rounded-lg shadow transition-colors duration-200"
          >
            <p className="text-center text-white">고객 페이지로 이동하기</p>
          </Link>

          <Link
            to="/employee"
            className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-3 px-4 rounded-lg shadow transition-colors duration-200"
          >
            <p className="text-center text-white">관리자 페이지로 이동하기</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
