interface ColProps {
  cols: number;
  size?: "md" | "lg";
}

export const Col: React.FC<ColProps> = (props) => {
  return (
    <div className={`col-${props.size ?? "md"}-${props.cols}`}>
      {props.children}
    </div>
  );
};
