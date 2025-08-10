// 타입 정의 추가
export interface GazeData {
  x: number;
  y: number;
  timestamp: number;
  sectionId?: string | null;
  currentPage?: string;
}

export interface PageChangeData {
  currentPage: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: "gazeData" | "pageChange" | "gaze" | "status" | "clientCount" | "error";
  data: GazeData | PageChangeData | string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // 콜백 함수들을 private 속성으로 정의
  private gazeCallback?: (data: GazeData) => void;
  private pageChangeCallback?: (data: PageChangeData) => void;
  private connectCallback?: () => void;
  private disconnectCallback?: () => void;
  private errorCallback?: (error: string) => void;

  connect() {
    try {
      const wsUrl = import.meta.env.DEV
        ? import.meta.env.VITE_WS_URL
        : import.meta.env.VITE_WS_EC2_URL;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("✅ WebSocket 연결됨");
        this.reconnectAttempts = 0;
        if (this.connectCallback) {
          this.connectCallback();
        }
      };

      this.socket.onclose = (event) => {
        console.log("❌ WebSocket 연결 종료", event);
        if (this.disconnectCallback) {
          this.disconnectCallback();
        }
        // 에러 콜백 호출 추가
        if (this.errorCallback) {
          this.errorCallback("WebSocket 연결 종료");
        }
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket 에러:", error);
        // 에러 콜백 호출 추가
        if (this.errorCallback) {
          this.errorCallback("WebSocket 에러 발생");
        }
      };

      // 메시지 핸들러 설정
      this.socket.onmessage = this.handleMessage;
    } catch (error) {
      console.error("WebSocket 연결 실패:", error);
      // 에러 콜백 호출 추가
      if (this.errorCallback) {
        this.errorCallback("WebSocket 연결 실패");
      }
    }
  }

  // 연결 상태 리스너
  onConnect(callback: () => void) {
    this.connectCallback = callback;
  }

  onDisconnect(callback: () => void) {
    this.disconnectCallback = callback;
  }

  // 페이지 변경 데이터 전송
  sendPageChange(currentPage: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const pageData: PageChangeData = {
        currentPage,
        timestamp: Date.now(),
      };
      this.socket.send(
        JSON.stringify({
          type: "pageChange",
          data: pageData,
        })
      );
    }
  }

  // 시선 데이터 전송 시 현재 페이지 정보 전송
  sendGazeData(
    x: number,
    y: number,
    sectionId?: string | null,
    currentPage?: string
  ) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const gazeData: GazeData = {
        x,
        y,
        sectionId,
        currentPage,
        timestamp: Date.now(),
      };
      this.socket.send(
        JSON.stringify({
          type: "gazeData",
          data: gazeData,
        })
      );
    }
  }

  // 시선 데이터 리스너
  onGazeData(callback: (data: GazeData) => void) {
    this.gazeCallback = callback;
  }

  // 페이지 변경 리스너
  onPageChange(callback: (data: PageChangeData) => void) {
    this.pageChangeCallback = callback;
  }

  // 에러 핸들링용 메서드
  onError(callback: (error: string) => void) {
    this.errorCallback = callback;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(
          `재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
        );
        this.connect();
      }, 2000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // 메시지 핸들러
  // 메시지 타입에 따라 적절한 콜백 호출
  private handleMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case "gazeData":
        case "gaze":
          if (this.gazeCallback && typeof message.data === "object") {
            this.gazeCallback(message.data as GazeData);
          }
          break;

        case "pageChange":
          if (this.pageChangeCallback && typeof message.data === "object") {
            this.pageChangeCallback(message.data as PageChangeData);
          }
          break;

        case "error":
          if (this.errorCallback && typeof message.data === "string") {
            this.errorCallback(message.data);
          }
          break;
        case "clientCount":
          // 클라이언트 수 업데이트 로직 추가
          console.log("현재 클라이언트 수:", message.data);

          break;

        default:
          console.warn("알 수 없는 메시지 타입:", message.type);
      }
    } catch (error) {
      console.error("WebSocket 메시지 파싱 오류:", error);
    }
  };
}

export const websocketService = new WebSocketService();
