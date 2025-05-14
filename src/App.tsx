import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Camera from "@/pages/Camera";
import AdjustFrame from "@/pages/AdjustFrame";
import Result from "@/pages/Result"; // Kalau mau nanti aku sekalian buat ResultPage

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/adjust" element={<AdjustFrame />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </Router>
  );
}
