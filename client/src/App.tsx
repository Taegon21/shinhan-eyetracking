import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CalibrationView from "./pages/CalibrationView";
import CustomerView from "./pages/CustomerView";
import EmployeeView from "./pages/EmployeeView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/calibration" element={<CalibrationView />} />
        <Route path="/customer" element={<CustomerView />} />
        <Route path="/employee" element={<EmployeeView />} />
      </Routes>
    </Router>
  );
}
