import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const handleClickButton1 = () => {
    console.log('VP Button Clicked');
    navigate('/vp/login');
  };

  const handleClickButton2 = () => {
    console.log('TA Button Clicked');
    navigate('/ta/login');
  };

  return (
    <div>
      <button onClick={handleClickButton1}>
        Vice Principal
      </button>
      
      <button onClick={handleClickButton2}>
        Teacher Assistants
      </button>
    </div>
  );
}

export default Home;