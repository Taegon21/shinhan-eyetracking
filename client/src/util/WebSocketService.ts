// 타입 정의 추가
export interface GazeData {
  x: number;
  y: number;
  ts: number;
  sectionId?: string | null;
}

export interface WebSocketMessage {
  type: "gaze" | "status" | "error";
  data: GazeData | string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    try {
      const wsUrl = import.meta.env.DEV
        ? import.meta.env.VITE_WS_URL
        : import.meta.env.VITE_WS_EC2_URL;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("✅ WebSocket 연결됨");
        this.reconnectAttempts = 0;
      };

      this.socket.onclose = () => {
        console.log("❌ WebSocket 연결 종료");
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket 에러:", error);
      };
    } catch (error) {
      console.error("WebSocket 연결 실패:", error);
    }
  }

  sendGazeData(x: number, y: number, sectionId?: string | null) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const data: GazeData = {
        x,
        y,
        ts: Date.now(),
        sectionId,
      };
      this.socket.send(JSON.stringify(data));
    }
  }

  // any 대신 명확한 타입 사용
  onGazeData(callback: (data: GazeData) => void) {
    if (this.socket) {
      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === "gaze" && typeof message.data === "object") {
            callback(message.data as GazeData);
          }
        } catch (error) {
          console.error("메시지 파싱 실패:", error);
        }
      };
    }
  }

  // 에러 핸들링용 메서드 추가
  onError(callback: (error: string) => void) {
    if (this.socket) {
      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === "error" && typeof message.data === "string") {
            callback(message.data);
          }
        } catch (error) {
          console.error("메시지 파싱 실패:", error);
        }
      };
    }
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
}

export const websocketService = new WebSocketService();
