export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str: string, max = 160) {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

