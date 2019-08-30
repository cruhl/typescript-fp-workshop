import { pipe, spy } from "@grapheng/prelude";

export const message = (name: string): string => pipe(`Hello, ${name}!`);

export const main = () =>
  pipe(
    "Conner",
    message,
    spy
  );

main();
