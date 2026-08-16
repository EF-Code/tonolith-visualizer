import type { CpuOutput } from "tonolith/browser";

export type TraceRow = {
  address: number;
  word: number;
  mnemonic: string;
  beforeHash: string;
  afterHash: string;
  instructionCount: bigint;
  output?: CpuOutput;
};

export function outputValues(history: readonly TraceRow[]): number[] {
  return history.flatMap((row) => (row.output === undefined ? [] : [row.output.value]));
}

export function outputRows(history: readonly TraceRow[]): TraceRow[] {
  return history.filter((row) => row.output !== undefined);
}
