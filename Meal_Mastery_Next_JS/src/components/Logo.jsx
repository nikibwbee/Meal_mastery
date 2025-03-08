import React from 'react';

const Logo = ({containerClass}) => {
  return (
    <div className="text-center">
      <div>
        <img src="./MM.png" className={` w-50 h-40 ${containerClass}`}/>
      </div>
     
   
    </div>
  );
};

export default Logo;