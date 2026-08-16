export type RunState = "ready" | "running" | "halted";

export function runStateLabel(running: boolean, halted: boolean): string {
  if (halted) return "HALTED";
  return running ? "EXECUTING" : "READY";
}

export function machineStateLabel(halted: boolean): string {
  return halted ? "HALTED" : "RUNNING";
}
