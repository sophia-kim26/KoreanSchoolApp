import React, { useState } from 'react';
import VPLogin from './VPLogin.jsx';

function MyComponent() {
  const [showVPLogin, setShowVPLogin] = useState(false);

  const handleVPButton = () => {
    console.log('VP Button Clicked');
    setShowVPLogin(true);
    // Add your specific logic for button 1 here
  };

  const handleClickButton2 = () => {
    console.log('TA Button Clicked');
    // Add your specific logic for button 2 here
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

