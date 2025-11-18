import React from "react";

function MyComponent() {
  const handleClickButton1 = () => {
    console.log('VP Button Clicked');
    // Add your specific logic for button 1 here
  };

  const handleClickButton2 = () => {
    console.log('TA Button Clicked');
    // Add your specific logic for button 2 here
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

export default MyComponent;
