type Props = {
  baseYear: number;
  name: string;
};

export function Copyright({ baseYear, name }: Props) {
  const year = new Date().getFullYear();

  return (
    <>
      All rights reserved. &copy; {baseYear}{year > baseYear && `—${year}`}{" "}
      <span className="font-medium">{name}</span>
    </>
  );
}
