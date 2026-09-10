import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PointsList from './pages/PointsList';
import PointDetail from './pages/PointDetail';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminSchoolDetail from './pages/AdminSchoolDetail';  

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/points" element={<PointsList />} />
        <Route path="/points/:pointNo" element={<PointDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/schools/:schoolId" element={<AdminSchoolDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;