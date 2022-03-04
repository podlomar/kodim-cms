import { Entry } from "./entry.js";

export const findChild = <T extends Entry>(
  children: T[], link: string
): { child: T, pos: number } | null => {
  const position = children.findIndex((child) => child.link === link);

  if (position < 0) {
    return null;
  }

  return {
    child: children[position],
    pos: position,
  };
}
