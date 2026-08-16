import {
  createInitialState,
  disassembleWord,
  executeInstruction,
  stateHash,
  type CpuOutput,
  type CpuState,
} from "tonolith/browser";
import rawManifest from "../data/fibonacci-testnet.json";
import { FIBONACCI_ROM } from "./program";

export type TestnetOutput = {
  outputIndex: number;
  instructionCount: number;
  value: number;
  outputCommitment: string;
};

export type TestnetStep = {
  advanceCount: number;
  queryId: string;
  expectedAdvanceCount: string;
  expectedStateHash: string;
  maxInstructions: number;
  startInstruction: number;
  endInstruction: number;
  previousStateHash: string;
  nextStateHash: string;
  finalPc: number;
  status: "running" | "halted";
  transactionHash: string;
  transactionUrl: string;
  logicalTime: string;
  observedAt: string;
  keeperAddress: string;
  feeNanoTon: string;
  inputValueNanoTon: string;
  output?: TestnetOutput;
};

export type TestnetRunManifest = {
  schemaVersion: number;
  name: string;
  network: "testnet";
  contractAddress: string;
  bounceableAddress: string;
  accountUrl: string;
  source: {
    provider: string;
    endpoint: string;
    capturedAt: string;
    transactionLimit: number;
    transactionCount: number;
    note: string;
  };
  commitments: {
    romRoot: string;
    staticCommitment: string;
    initialCoreStateHash: string;
    finalCoreStateHash: string;
  };
  deployment: {
    transactionHash: string;
    transactionUrl: string;
    logicalTime: string;
    observedAt: string;
    deployerAddress: string;
    valueNanoTon: string;
    stateInitHash: string;
    codeHash: string;
    dataHash: string;
  };
  currentAccount: {
    state: string;
    balanceNanoTon: string;
    codeHash: string;
    dataHash: string;
    lastTransactionLogicalTime: string;
    lastTransactionHash: string;
  };
  finalState: {
    advanceCount: number;
    instructionCount: number;
    pc: number;
    status: "running" | "halted";
    outputCount: number;
    outputRegister: number;
  };
  verification: {
    acceptedAdvanceTransactions: number;
    decodedAdvancedEvents: number;
    decodedOutputEvents: number;
    outputSequence: number[];
    everySubmittedHashMatchedPreviousEvent: boolean;
    everyAdvanceCountWasSequential: boolean;
    allTransactionsIncludedInAccountHistory: boolean;
    finalStatus: string;
  };
  steps: TestnetStep[];
};

export type TestnetTraceRow = {
  chain: TestnetStep;
  state: CpuState;
  address: number;
  word: number;
  mnemonic: string;
  beforeHash: string;
  afterHash: string;
  localStateMatchesChain: boolean;
  output?: CpuOutput;
};

export const TESTNET_RUN = rawManifest as TestnetRunManifest;

function localOutputMatchesChain(
  output: CpuOutput | undefined,
  chainOutput: TestnetOutput | undefined,
): boolean {
  if (output === undefined || chainOutput === undefined) {
    return output === undefined && chainOutput === undefined;
  }
  return (
    Number(output.outputIndex) === chainOutput.outputIndex &&
    Number(output.instructionCount) === chainOutput.instructionCount &&
    output.value === chainOutput.value
  );
}

export function buildTestnetTrace(): TestnetTraceRow[] {
  let state = createInitialState();
  const rows: TestnetTraceRow[] = [];
  const initialHash = stateHash(state);

  if (initialHash !== TESTNET_RUN.commitments.initialCoreStateHash) {
    throw new Error("testnet snapshot initial hash does not match the canonical emulator");
  }

  for (const chain of TESTNET_RUN.steps) {
    const address = state.pc;
    const word = FIBONACCI_ROM[address] ?? 0;
    const beforeHash = stateHash(state);
    const result = executeInstruction(state, FIBONACCI_ROM);
    const nextState: CpuState = {
      ...result.state,
      advanceCount: result.state.advanceCount + BigInt(1),
    };
    const afterHash = stateHash(nextState);
    const localStateMatchesChain =
      beforeHash === chain.previousStateHash &&
      afterHash === chain.nextStateHash &&
      nextState.pc === chain.finalPc &&
      (nextState.status === "halted") === (chain.status === "halted") &&
      localOutputMatchesChain(result.output, chain.output);

    if (!localStateMatchesChain) {
      throw new Error(`testnet snapshot diverges from the canonical emulator at advance ${chain.advanceCount}`);
    }

    rows.push({
      chain,
      state: nextState,
      address,
      word,
      mnemonic: disassembleWord(word),
      beforeHash,
      afterHash,
      localStateMatchesChain,
      ...(result.output === undefined ? {} : { output: result.output }),
    });
    state = nextState;
  }

  if (stateHash(state) !== TESTNET_RUN.commitments.finalCoreStateHash) {
    throw new Error("testnet snapshot final hash does not match the canonical emulator");
  }

  return rows;
}

export const TESTNET_TRACE = buildTestnetTrace();

export function formatTon(nanoTon: string): string {
  const value = Number(nanoTon) / 1_000_000_000;
  return `${value.toFixed(value < 0.01 ? 4 : 3)} TON`;
}

export function shortAddress(address: string): string {
  if (address.length <= 18) {
    return address;
  }
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}
