import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './scenes/dashboard/Dashboard';
import Sidemenu from './scenes/sidemenu/Sidemenu';

function App() {
  return (
    <div className="App">
      <div style={{ width: '100%', height: '100vh', overflow: 'hidden', display:'flex', flexDirection: 'row' }}>
        <Sidemenu ></Sidemenu>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
