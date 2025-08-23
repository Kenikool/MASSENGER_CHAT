// src/components/LoadingSpinner.jsx

import React from "react";

const LoadingSpinner = ({ size = "md" }) => {
  // Define spinner sizes
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex justify-center items-center">
      <div
        className={`
          ${spinnerSize} 
          border-2 
          rounded-full 
          border-solid 
          border-primary 
          border-t-transparent 
          animate-spin
        `}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
