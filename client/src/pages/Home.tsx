import React from "react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import './style/global.css';
import logo from '../assets/logo.png';

function Home(): React.ReactElement {
  const navigate: NavigateFunction = useNavigate();

  const handleClickVP = (): void => {
    navigate('/vp/login');
  };

  const handleClickTA = (): void => {
    navigate('/ta/login');
  };

  return (
    <div className="bg-gray-100" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem'
    }}>
      <img 
        src={logo} 
        alt="Logo" 
        className="page-logo"
      />
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: '#333',
        margin: 0 
      }}>
        Log in as:
      </h1>
      
      <div className="relative" style={{ width: '512px', height: '512px' }}>
        <svg viewBox="0 0 200 200" className="yin-yang-svg" style={{ width: '100%', height: '100%' }}>
          {/* Red (bottom) button - flipped vertically */}
          <path
            id="vpPath"
            d="M 100 200 A 40 40 0 0 0 100 100 A 40 40 0 0 1 100 0 A 100 100 0 0 1 100 200"
            fill="#cd313a"
            className="yin-yang-path cursor-pointer transition-transform opacity-100 hover:scale-100 active:opacity-95 origin-center"
            onClick={() => handleClickVP()}
          />

          {/* Blue (top) button */}
          <path
            d="M 100 0 A 40 40 0 0 0 100 100 A 40 40 0 0 1 100 200 A 100 100 0 0 1 100 0"
            fill="#0047a0"
            className="yin-yang-path cursor-pointer transition-transform opacity-100 hover:scale-100 active:opacity-95 origin-center"
            onClick={() => handleClickTA()}
          />

          {/* Text labels */}
          <text 
            x="60" 
            y="130" 
            fill="white" 
            fontSize="14" 
            fontWeight="bold" 
            textAnchor="middle"
            className="pointer-events-none"
            style={{ transform: 'rotate(75deg)', transformOrigin: '60px 110px' }}
          >
            Teacher Assistants
          </text>

          <text 
            x="140" 
            y="80" 
            fill="white" 
            fontSize="14" 
            fontWeight="bold" 
            textAnchor="middle"
            className="pointer-events-none"
            style={{ transform: 'rotate(75deg)', transformOrigin: '140px 90px' }}
          >
            Vice-Principal
          </text>
        </svg>
      </div>
    </div>
  );
}

export default Home;