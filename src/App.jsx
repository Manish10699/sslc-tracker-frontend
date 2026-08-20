import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PointsList from './pages/PointsList';
import PointDetail from './pages/PointDetail'; 
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/points" element={<PointsList />} />
         <Route path="/points/:pointNo" element={<PointDetail />} />
         <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;