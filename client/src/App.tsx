import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { websocketService } from "./util/WebSocketService";
import CustomerView from "./pages/CustomerView";
import EmployeeView from "./pages/EmployeeView";
import NotFound from "./pages/NotFound";

export default function App() {
  useEffect(() => {
    console.log("🔌 WebSocket 연결 시작");
    websocketService.connect();

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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
