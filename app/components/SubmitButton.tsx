interface SubmitButtonProps {
  title: string;
}

export function SubmitButton(props: SubmitButtonProps) {
  return (
    <div className="form-group">
      <input className="btn btn-primary" type="submit" value={props.title} />
    </div>
  );
}
