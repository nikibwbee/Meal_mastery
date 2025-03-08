import React from 'react';
import './button.style.css';

const Button = () => {
  return (
    <button className="button">
      <span className="text">Submit</span>
      <div className="liquid">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
    </button>
    
  );
};

export default Button;
