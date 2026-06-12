export const formatPKR = (n: number): string =>
  `₨${new Intl.NumberFormat("en-PK").format(Math.round(n))}`;
