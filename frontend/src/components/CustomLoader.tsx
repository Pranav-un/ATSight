import React from "react";
import "./CustomLoader.css";

interface CustomLoaderProps {
  className?: string;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({ className = "" }) => {
  return (
    <div className={`custom-loader ${className}`}>
      <div className="loader"></div>
    </div>
  );
};

export default CustomLoader;
