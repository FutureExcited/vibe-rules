import chalk from "chalk";

// Debug logging utility
export let isDebugEnabled = false;

export function setDebugEnabled(enabled: boolean) {
  isDebugEnabled = enabled;
}

export type ChalkColor =
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "cyan"
  | "magenta"
  | "gray"
  | "grey"
  | "white"
  | "black"
  | "dim";

export const debugLog = (message: string, color?: ChalkColor | null, ...optionalParams: any[]) => {
  if (isDebugEnabled) {
    const colorFn = color ? chalk[color] : chalk.dim;
    console.log(colorFn(`[Debug] ${message}`), ...optionalParams);
  }
};
