interface ColProps {
  cols: number;
  size?: "md" | "lg";
  children?: React.ReactNode;
}

export const Col: React.FC<ColProps> = (props) => {
  return (
    <div className={`col-${props.size ?? "md"}-${props.cols}`}>
      {props.children}
    </div>
  );
};
