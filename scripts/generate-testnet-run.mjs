import { mkdir, writeFile } from "node:fs/promises";
import { Cell } from "@ton/core";

const CONTRACT_ADDRESS = "kQDCENlXgMC1FOWvEtM2wKcJHBLKS86Tbkv9xkT0u5aIa1av";
const BOUNCEABLE_ADDRESS = "EQDCENlXgMC1FOWvEtM2wKcJHBLKS86Tbkv9xkT0u5aIa-0l";
const API_BASE = "https://testnet.toncenter.com/api/v2";
const EXPLORER_BASE = "https://testnet.tonviewer.com";
const ROM_ROOT = "029ccf15774f680518705bb7c8be4b2ca92f34a4ceb9c963e55609225398c748";
const STATIC_COMMITMENT = "50da71fe389768e885c8258c7f4f4a97b86598738eed974336d527e459024f08";

class BitReader {
  constructor(bytes) {
    this.bytes = bytes;
    this.position = 0;
  }

  read(width) {
    let value = 0n;
    for (let index = 0; index < width; index += 1) {
      const byte = this.bytes[Math.floor(this.position / 8)] ?? 0;
      const bit = (byte >> (7 - (this.position % 8))) & 1;
      value = (value << 1n) | BigInt(bit);
      this.position += 1;
    }
    return value;
  }

  hex(width) {
    return this.read(width).toString(16).padStart(width / 4, "0");
  }
}

function decodeBody(encoded) {
  if (!encoded) {
    return null;
  }
  const bytes = Buffer.from(encoded.replace(/\s/g, ""), "base64");
  const reader = new BitReader(bytes);
  const opcode = Number(reader.read(32));

  if (opcode === 0x544e4c01) {
    return {
      kind: "advance",
      queryId: reader.read(64).toString(),
      expectedAdvanceCount: reader.read(64).toString(),
      expectedStateHash: reader.hex(256),
      maxInstructions: Number(reader.read(16)),
    };
  }

  if (opcode === 0x544e4c81) {
    return {
      kind: "advanced",
      queryId: reader.read(64).toString(),
      advanceCount: reader.read(64).toString(),
      startInstruction: reader.read(64).toString(),
      endInstruction: reader.read(64).toString(),
      previousStateHash: reader.hex(256),
      nextStateHash: reader.hex(256),
      finalPc: Number(reader.read(10)),
      status: Number(reader.read(1)),
    };
  }

  if (opcode === 0x544e4c82) {
    return {
      kind: "output",
      outputIndex: reader.read(64).toString(),
      instructionCount: reader.read(64).toString(),
      value: Number(reader.read(4)),
      outputCommitment: reader.hex(256),
    };
  }

  return { kind: "other", opcode };
}

function base64Url(value) {
  return value.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function explorerUrl(transactionHash) {
  return `${EXPLORER_BASE}/transaction/${base64Url(transactionHash)}`;
}

function timestamp(utime) {
  return new Date(Number(utime) * 1000).toISOString();
}

function hashCell(encoded) {
  return Cell.fromBoc(Buffer.from(encoded, "base64"))[0].hash().toString("hex");
}

function stateInitHashes(encoded) {
  const stateInit = Cell.fromBoc(Buffer.from(encoded, "base64"))[0];
  const slice = stateInit.beginParse();
  slice.loadBit();
  slice.loadBit();
  const hasCode = slice.loadBit();
  const hasData = slice.loadBit();
  const hasLibrary = slice.loadBit();
  const code = hasCode ? slice.loadRef() : null;
  const data = hasData ? slice.loadRef() : null;
  if (hasLibrary) {
    slice.loadRef();
  }
  if (code === null || data === null) {
    throw new Error("deployment state-init did not contain code and data cells");
  }
  return {
    stateInitHash: stateInit.hash().toString("hex"),
    codeHash: code.hash().toString("hex"),
    dataHash: data.hash().toString("hex"),
  };
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}/${path}`);
  if (!response.ok) {
    throw new Error(`TON Center request failed: ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  if (!body.ok) {
    throw new Error(`TON Center returned an error for ${path}`);
  }
  return body.result;
}

const transactions = await getJson(
  `getTransactions?address=${encodeURIComponent(CONTRACT_ADDRESS)}&limit=100`,
);
const account = await getJson(`getAddressInformation?address=${encodeURIComponent(CONTRACT_ADDRESS)}`);
const deployment = transactions.find((transaction) => transaction.in_msg.msg_data?.init_state);

if (deployment === undefined) {
  throw new Error("could not find the deployment transaction in the bounded history snapshot");
}

const deploymentHashes = stateInitHashes(deployment.in_msg.msg_data.init_state);
const currentCodeHash = hashCell(account.code);
const currentDataHash = hashCell(account.data);
const steps = [];

for (const transaction of transactions) {
  const input = decodeBody(transaction.in_msg.message);
  if (input?.kind !== "advance") {
    continue;
  }

  const events = (transaction.out_msgs ?? [])
    .map((message) => decodeBody(message.message))
    .filter((message) => message !== null);
  const advanced = events.find((event) => event.kind === "advanced");
  if (advanced === undefined) {
    throw new Error(`advance transaction ${transaction.transaction_id.lt} has no CpuAdvanced event`);
  }

  const output = events.find((event) => event.kind === "output");
  steps.push({
    advanceCount: Number(advanced.advanceCount),
    queryId: input.queryId,
    expectedAdvanceCount: input.expectedAdvanceCount,
    expectedStateHash: input.expectedStateHash,
    maxInstructions: input.maxInstructions,
    startInstruction: Number(advanced.startInstruction),
    endInstruction: Number(advanced.endInstruction),
    previousStateHash: advanced.previousStateHash,
    nextStateHash: advanced.nextStateHash,
    finalPc: advanced.finalPc,
    status: advanced.status === 1 ? "halted" : "running",
    transactionHash: base64Url(transaction.transaction_id.hash),
    transactionUrl: explorerUrl(transaction.transaction_id.hash),
    logicalTime: transaction.transaction_id.lt,
    observedAt: timestamp(transaction.utime),
    keeperAddress: transaction.in_msg.source,
    feeNanoTon: transaction.fee,
    inputValueNanoTon: transaction.in_msg.value,
    ...(output === undefined
      ? {}
      : {
          output: {
            outputIndex: Number(output.outputIndex),
            instructionCount: Number(output.instructionCount),
            value: output.value,
            outputCommitment: output.outputCommitment,
          },
        }),
  });
}

steps.sort((left, right) => left.advanceCount - right.advanceCount);

if (steps.length !== 97) {
  throw new Error(`expected 97 accepted advances, found ${steps.length}`);
}

for (const [index, step] of steps.entries()) {
  const expectedCount = index + 1;
  if (
    step.advanceCount !== expectedCount ||
    step.expectedAdvanceCount !== String(index) ||
    step.startInstruction !== index ||
    step.endInstruction !== expectedCount ||
    step.expectedStateHash !== step.previousStateHash ||
    step.maxInstructions !== 1
  ) {
    throw new Error(`advance ${expectedCount} did not satisfy the expected commitment chain`);
  }
}

const outputs = steps.flatMap((step) => (step.output === undefined ? [] : [step.output.value]));
const finalStep = steps.at(-1);
if (
  finalStep === undefined ||
  JSON.stringify(outputs) !== JSON.stringify([1, 1, 2, 3, 5, 8, 13]) ||
  finalStep.status !== "halted" ||
  finalStep.finalPc !== 21 ||
  finalStep.nextStateHash !== "16925a27b1db66171cebb3d43c74702f06f4a362e302754f24026cca0a6bf2be"
) {
  throw new Error("historical testnet trace did not match the canonical Fibonacci terminal state");
}

const capturedAt = new Date().toISOString();
const manifest = {
  schemaVersion: 1,
  name: "Tonolith v1 Fibonacci testnet run",
  network: "testnet",
  contractAddress: CONTRACT_ADDRESS,
  bounceableAddress: BOUNCEABLE_ADDRESS,
  accountUrl: `${EXPLORER_BASE}/${CONTRACT_ADDRESS}`,
  source: {
    provider: "TON Center v2",
    endpoint: API_BASE,
    capturedAt,
    transactionLimit: 100,
    transactionCount: transactions.length,
    note: "Historical read-only snapshot. Transaction bodies and Cpu events were decoded from the public testnet account history.",
  },
  commitments: {
    romRoot: ROM_ROOT,
    staticCommitment: STATIC_COMMITMENT,
    initialCoreStateHash: steps[0].previousStateHash,
    finalCoreStateHash: finalStep.nextStateHash,
  },
  deployment: {
    transactionHash: base64Url(deployment.transaction_id.hash),
    transactionUrl: explorerUrl(deployment.transaction_id.hash),
    logicalTime: deployment.transaction_id.lt,
    observedAt: timestamp(deployment.utime),
    deployerAddress: deployment.in_msg.source,
    valueNanoTon: deployment.in_msg.value,
    stateInitHash: deploymentHashes.stateInitHash,
    codeHash: deploymentHashes.codeHash,
    dataHash: deploymentHashes.dataHash,
  },
  currentAccount: {
    state: account.state,
    balanceNanoTon: account.balance,
    codeHash: currentCodeHash,
    dataHash: currentDataHash,
    lastTransactionLogicalTime: account.last_transaction_id.lt,
    lastTransactionHash: base64Url(account.last_transaction_id.hash),
  },
  finalState: {
    advanceCount: finalStep.advanceCount,
    instructionCount: finalStep.endInstruction,
    pc: finalStep.finalPc,
    status: finalStep.status,
    outputCount: outputs.length,
    outputRegister: outputs.at(-1),
  },
  verification: {
    acceptedAdvanceTransactions: steps.length,
    decodedAdvancedEvents: steps.length,
    decodedOutputEvents: outputs.length,
    outputSequence: outputs,
    everySubmittedHashMatchedPreviousEvent: true,
    everyAdvanceCountWasSequential: true,
    allTransactionsIncludedInAccountHistory: true,
    finalStatus: "halted",
  },
  steps,
};

await mkdir("data", { recursive: true });
await writeFile(
  "data/fibonacci-testnet.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `testnet snapshot: ${steps.length} advances, ${outputs.length} output events, final hash ${finalStep.nextStateHash}`,
);
