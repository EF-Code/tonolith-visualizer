export function hex(value: bigint | number, width = 0): string {
  return `0x${value.toString(16).padStart(width, "0")}`;
}

export function decimal(value: bigint | number): string {
  return value.toString(10);
}

export function shortHash(value: string): string {
  if (value.length <= 18) {
    return value;
  }
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function binary(value: number, width: number): string {
  return value.toString(2).padStart(width, "0");
}
