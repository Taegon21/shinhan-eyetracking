class WebSocketService {
  private socket: WebSocket | null = null;
  private url = "ws://localhost:8080/ws";

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("🟢 WebSocket 연결 성공");
    };

    this.socket.onmessage = (e) => {
      console.log("📩 서버로부터 수신:", e.data);
    };

    this.socket.onerror = (e) => {
      console.error("🔴 WebSocket 오류:", e);
    };

    this.socket.onclose = () => {
      console.log("🔌 연결 종료");
    };
  }

  sendGazeData(x: number, y: number) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ x, y, ts: Date.now() }));
    }
  }

  disconnect() {
    this.socket?.close();
  }
}

export const websocketService = new WebSocketService();
