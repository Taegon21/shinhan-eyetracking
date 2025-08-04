import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { websocketService } from "./util/WebSocketService";
import CustomerView from "./pages/CustomerView";
import EmployeeView from "./pages/EmployeeView";

export default function App() {
  useEffect(() => {
    // 앱 시작 시 WebSocket 연결
    console.log("🔌 WebSocket 연결 시작");
    websocketService.connect();

    // 앱 종료 시 WebSocket 해제
    return () => {
      console.log("🔌 WebSocket 연결 종료");
      websocketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/customer" element={<CustomerView />} />
        <Route path="/employee" element={<EmployeeView />} />
      </Routes>
    </Router>
  );
}
