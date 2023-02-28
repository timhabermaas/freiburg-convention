import React from "react";

interface RowProps {
  centered?: boolean;
  children?: React.ReactNode;
}

export const Row: React.FC<RowProps> = (props) => {
  return (
    <div className={`row ${props.centered ? "justify-content-center" : ""}`}>
      {props.children}
    </div>
  );
};
