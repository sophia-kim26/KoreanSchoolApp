<<<<<<< HEAD:client/src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();

  const handleClickButton1 = () => {
    console.log('VP Button Clicked');
    navigate('/vp/login');
=======
import React, { useState } from 'react';
import VPLogin from './VPLogin.jsx';

function MyComponent() {
  const [showVPLogin, setShowVPLogin] = useState(false);

  const handleVPButton = () => {
    console.log('VP Button Clicked');
    setShowVPLogin(true);
    // Add your specific logic for button 1 here
>>>>>>> 3c610e3d8bc76129ae4c170d8917fbc35c609601:client/src/pages/Choice.jsx
  };

  const handleClickButton2 = () => {
    console.log('TA Button Clicked');
    navigate('/ta/login');
  };

  return (
    <div>
      <button onClick={handleVPButton}>
        Vice Principal
      </button>f
      {showVPLogin && <VPLogin />}

      <button onClick={handleClickButton2}>
        Teacher Assistants
      </button>
    </div>
  );
}

export default MyComponent;

