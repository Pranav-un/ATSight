import React from "react";

interface CustomLoaderInlineProps {
  className?: string;
}

const CustomLoaderInline: React.FC<CustomLoaderInlineProps> = ({
  className = "",
}) => {
  // Inline styles for the loader
  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
  };

  const loaderStyle: React.CSSProperties = {
    position: "relative",
    width: "120px",
    height: "90px",
    margin: "0 auto",
  };

  const beforeStyle: React.CSSProperties = {
    content: '""',
    position: "absolute",
    bottom: "30px",
    left: "50px",
    height: "30px",
    width: "30px",
    borderRadius: "50%",
    background: "#2a9d8f",
    animation: "loading-bounce 0.5s ease-in-out infinite alternate",
  };

  const afterStyle: React.CSSProperties = {
    content: '""',
    position: "absolute",
    right: "0",
    top: "0",
    height: "7px",
    width: "45px",
    borderRadius: "4px",
    boxShadow: "0 5px 0 #f2f2f2, -35px 50px 0 #f2f2f2, -70px 95px 0 #f2f2f2",
    animation: "loading-step 1s ease-in-out infinite",
  };

  // CSS keyframes need to be added to the document
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes loading-bounce {
        0% { transform: scale(1, 0.7); }
        40% { transform: scale(0.8, 1.2); }
        60% { transform: scale(1, 1); }
        100% { bottom: 140px; }
      }
      
      @keyframes loading-step {
        0% {
          box-shadow: 0 10px 0 rgba(0, 0, 0, 0),
                      0 10px 0 #f2f2f2,
                      -35px 50px 0 #f2f2f2,
                      -70px 90px 0 #f2f2f2;
        }
        100% {
          box-shadow: 0 10px 0 #f2f2f2,
                      -35px 50px 0 #f2f2f2,
                      -70px 90px 0 #f2f2f2,
                      -70px 90px 0 rgba(0, 0, 0, 0);
        }
      }
      
      .loader-element::before {
        content: "";
        position: absolute;
        bottom: 30px;
        left: 50px;
        height: 30px;
        width: 30px;
        border-radius: 50%;
        background: #2a9d8f;
        animation: loading-bounce 0.5s ease-in-out infinite alternate;
      }
      
      .loader-element::after {
        content: "";
        position: absolute;
        right: 0;
        top: 0;
        height: 7px;
        width: 45px;
        border-radius: 4px;
        box-shadow: 0 5px 0 #f2f2f2, -35px 50px 0 #f2f2f2, -70px 95px 0 #f2f2f2;
        animation: loading-step 1s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={containerStyle} className={`custom-loader-inline ${className}`}>
      <div style={loaderStyle} className="loader-element"></div>
    </div>
  );
};

export default CustomLoaderInline;
