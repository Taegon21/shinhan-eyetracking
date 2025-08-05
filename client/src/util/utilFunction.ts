import type { GazeData } from "./WebSocketService";

interface Point {
  x: number;
  y: number;
}

export const generateShuffledPoints = (rows: number, cols: number): Point[] => {
  const padding = 80;
  const spacingX = (window.innerWidth - 2 * padding) / (cols - 1);
  const spacingY = (window.innerHeight - 2 * padding) / (rows - 1);
  const points: Point[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        x: padding + col * spacingX,
        y: padding + row * spacingY,
      });
    }
  }

  const extremePoints: Point[] = [
    { x: padding, y: padding },
    { x: window.innerWidth - padding, y: padding },
    { x: padding, y: window.innerHeight - padding },
    { x: window.innerWidth - padding, y: window.innerHeight - padding },
  ];

  const filtered = points.filter(
    (p) =>
      !extremePoints.some(
        (ep) => Math.abs(ep.x - p.x) < 1 && Math.abs(ep.y - p.y) < 1
      )
  );

  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  return [...extremePoints, ...filtered];
};

export const webgazerUtils = {
  // WebGazer 상태 확인
  isWebGazerReady(): boolean {
    return !!(
      window.webgazer &&
      window.webgazer.isReady &&
      window.webgazer.isReady()
    );
  },

  // WebGazer 초기화
  async initializeWebGazer(): Promise<boolean> {
    try {
      if (!window.webgazer) {
        console.warn("WebGazer 라이브러리가 로드되지 않았습니다.");
        return false;
      }

      if (!this.isWebGazerReady()) {
        await window.webgazer.setRegression("ridge").begin();
      }

      return true;
    } catch (error) {
      console.error("WebGazer 초기화 실패:", error);
      return false;
    }
  },

  // UI 요소 표시/숨김
  setUIVisibility(
    showVideo: boolean = false,
    showPoints: boolean = false
  ): void {
    if (window.webgazer) {
      window.webgazer
        .showVideoPreview(showVideo)
        .showPredictionPoints(showPoints);
    }
  },

  // 시선 추적 시작
  startGazeTracking(callback: (data: GazeData) => void): void {
    if (window.webgazer) {
      window.webgazer.setGazeListener(callback);
    }
  },

  // 시선 추적 중지
  stopGazeTracking(): void {
    if (window.webgazer) {
      window.webgazer.setGazeListener(null);
    }
  },
};

export const domUtils = {
  // 요소에서 섹션 ID 추출
  getSectionIdFromPoint(x: number, y: number): string | null {
    const targetElement = document.elementFromPoint(x, y);
    return (
      targetElement?.closest("[data-section]")?.getAttribute("data-section") ||
      null
    );
  },

  // 트래커 위치 업데이트
  updateTrackerPosition(
    trackerElement: HTMLElement | null,
    x: number,
    y: number
  ): void {
    if (trackerElement) {
      trackerElement.style.left = `${x}px`;
      trackerElement.style.top = `${y}px`;
    }
  },
};
