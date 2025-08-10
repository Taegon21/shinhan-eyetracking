import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { websocketService } from "./util/WebSocketService";
import CustomerView from "./pages/CustomerView";
import EmployeeView from "./pages/EmployeeView";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";

export default function App() {
  useEffect(() => {
    websocketService.connect();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer" element={<CustomerView />} />
        <Route path="/employee" element={<EmployeeView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
