import Sidebar from "./app/Components/Sidebar";
import Attendence from "./app/Pages/Attendance";
import Homes from "./app/Pages/Home";
import { BrowserRouter as Router, Route, Routes  } from "react-router-dom";

function App() {
  return (
    <Router>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Homes />} />
        <Route path="/Attendence" element={<Attendence />} />
      </Routes>
     </Router>
  );
}

export default App;
