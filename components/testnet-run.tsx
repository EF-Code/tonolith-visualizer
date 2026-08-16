"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createInitialState,
  decodeInstruction,
  disassembleWord,
  type CpuState,
} from "tonolith/browser";
import {
  FIBONACCI_PROGRAM,
  FIBONACCI_ROM,
  FIBONACCI_ROM_ROOT,
  FIBONACCI_STATIC_COMMITMENT,
} from "../lib/program";
import { binary, decimal, hex, shortHash } from "../lib/format";
import { OUTPUT_SLOT_COUNT, RAM_WINDOW_SIZE, SPEED_DEFAULT, SPEED_MAX, SPEED_MIN } from "../lib/ui";
import {
  TESTNET_RUN,
  TESTNET_TRACE,
  formatTon,
  shortAddress,
  type TestnetTraceRow,
} from "../lib/testnet-run";
import { machineStateLabel } from "../lib/labels";
import { PROGRAM_DESCRIPTION, PROGRAM_NAME, ROM_TREE_DESCRIPTION } from "../lib/program-info";
import type { VisualizerMode } from "./cpu-lab";

const INITIAL_STATE: CpuState = createInitialState();

export function TestnetRunLab({ onModeChange }: { onModeChange: (mode: VisualizerMode) => void }) {
  const [selectedIndex, setSelectedIndex] = useState(TESTNET_TRACE.length - 1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const selectedRow = selectedIndex >= 0 ? TESTNET_TRACE[selectedIndex] : undefined;
  const state = selectedRow?.state ?? INITIAL_STATE;
  const activeAddress = selectedRow?.address ?? state.pc;
  const activeWord = FIBONACCI_ROM[activeAddress] ?? 0;
  const activeMnemonic = disassembleWord(activeWord);
  const decoded = decodeInstruction(activeWord);
  const currentHash = selectedRow?.chain.nextStateHash ?? TESTNET_RUN.commitments.initialCoreStateHash;
  const outputs = TESTNET_TRACE
    .slice(0, selectedIndex + 1)
    .flatMap((trace) => (trace.chain.output === undefined ? [] : [trace.chain.output.value]));
  const outputEvents = TESTNET_TRACE
    .slice(0, selectedIndex + 1)
    .filter((trace) => trace.chain.output !== undefined);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setSelectedIndex((current) => {
        if (current >= TESTNET_TRACE.length - 1) {
          setRunning(false);
          return current;
        }
        return current + 1;
      });
    }, Math.max(100, 1000 / speed));
    return () => window.clearInterval(interval);
  }, [running, speed]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLButtonElement
      ) {
        return;
      }
      event.preventDefault();
      setRunning(false);
      setSelectedIndex((current) => Math.min(TESTNET_TRACE.length - 1, current + 1));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectStep = (index: number) => {
    setRunning(false);
    setSelectedIndex(index);
  };

  const replay = () => {
    setSelectedIndex(-1);
    setRunning(true);
  };

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Tonolith Visualizer home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>TONOLITH <em>VISUALIZER</em></span>
        </a>
        <div className="topbar-meta">
          <span className="network-dot" />
          <button className="mode-button mode-button-active" type="button" aria-pressed="true">TESTNET RUN</button>
          <button className="mode-button" type="button" aria-pressed="false" onClick={() => onModeChange("local")}>LOCAL EMULATOR</button>
          <span className="version">ISA v1</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">TONOLITH V1 / CONFIRMED TESTNET RUN</p>
          <h1>See the chain<br /><span>advance the CPU.</span></h1>
          <p className="hero-copy">
            Replay the recorded Fibonacci deployment one transaction at a time. The
            machine view is reconstructed from the canonical emulator and checked
            against each contract-emitted state hash.
          </p>
        </div>
        <div className="hero-proof">
          <div className="proof-line"><span>PROGRAM</span><strong title={PROGRAM_DESCRIPTION}>{PROGRAM_NAME}</strong></div>
          <div className="proof-line"><span>EXECUTION</span><strong>97 ADVANCES / 1 STEP</strong></div>
          <div className="proof-line"><span>NETWORK</span><strong className="muted-value">TON TESTNET</strong></div>
        </div>
      </section>

      <section className="control-strip" aria-label="Testnet replay controls">
        <div className="control-primary">
          <button className="button button-primary" type="button" onClick={() => {
            if (selectedIndex >= TESTNET_TRACE.length - 1) {
              replay();
            } else {
              setRunning((value) => !value);
            }
          }}>
            <span className="button-icon" aria-hidden="true">{running ? "Ⅱ" : "▶"}</span>
            {running ? "Pause" : selectedIndex >= TESTNET_TRACE.length - 1 ? "Replay run" : "Play run"}
          </button>
          <button className="button button-secondary" type="button" onClick={() => selectStep(selectedIndex - 1)} disabled={selectedIndex < 0 || running}>
            Previous
          </button>
          <button className="button button-secondary" type="button" aria-label="Advance to next transaction" onClick={() => selectStep(Math.min(TESTNET_TRACE.length - 1, selectedIndex + 1))} disabled={selectedIndex >= TESTNET_TRACE.length - 1 || running}>
            Next transaction <span className="key">SPACE</span>
          </button>
          <button className="button button-quiet" type="button" onClick={() => selectStep(-1)}>Reset</button>
        </div>
        <label className="speed-control">
          <span>PACE</span>
          <input aria-label="Replay pace in hertz" type="range" min={SPEED_MIN} max={SPEED_MAX} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
          <strong>{speed} Hz</strong>
        </label>
        <div className="run-state" aria-live="polite">
          <span className={`state-led ${selectedRow?.chain.status === "halted" ? "halted" : running ? "running" : "ready"}`} />
          {selectedRow?.chain.status === "halted" ? "HALTED" : running ? "REPLAYING" : "PAUSED"}
        </div>
      </section>

      <section className="panel timeline-panel" aria-label="Testnet transaction timeline">
        <div className="panel-heading compact-heading">
          <div><span className="panel-kicker">CHAIN / TRANSACTION TIMELINE</span><h2>97 accepted advances</h2></div>
          <span className="panel-count">{selectedIndex < 0 ? 0 : selectedIndex + 1} / {TESTNET_TRACE.length} SELECTED</span>
        </div>
        <label className="timeline-slider">
          <span>RUN POSITION</span>
          <input aria-label="Testnet run position" type="range" min={0} max={TESTNET_TRACE.length - 1} value={Math.max(0, selectedIndex)} onChange={(event) => selectStep(Number(event.target.value))} />
          <strong>{selectedIndex < 0 ? "START" : `ADVANCE ${(selectedIndex + 1).toString().padStart(2, "0")}`}</strong>
        </label>
        <div className="chain-timeline" role="list" aria-label="Accepted testnet advances">
          {TESTNET_TRACE.map((trace, index) => (
            <button
              className={`timeline-step ${index === selectedIndex ? "selected" : ""} ${index < selectedIndex ? "visited" : ""} ${trace.chain.output === undefined ? "" : "has-output"} ${trace.chain.status === "halted" ? "halt-step" : ""}`}
              type="button"
              key={trace.chain.transactionHash}
              aria-label={`Select advance ${trace.chain.advanceCount}${trace.chain.output === undefined ? "" : `, output ${trace.chain.output.value}`}`}
              aria-pressed={index === selectedIndex}
              onClick={() => selectStep(index)}
              title={`Advance ${trace.chain.advanceCount} · ${trace.mnemonic}${trace.chain.output === undefined ? "" : ` · output ${trace.chain.output.value}`}`}
            >
              <span>{trace.chain.output?.value ?? ""}</span>
            </button>
          ))}
        </div>
        <div className="timeline-legend"><span><i className="legend-dot" /> accepted Advance</span><span><i className="legend-dot output-dot" /> CpuOutput event</span><span><i className="legend-dot halt-dot" /> HALT</span></div>
      </section>

      <section className="lab-grid" aria-label="Testnet CPU visualization">
        <aside className="panel program-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">01 / ROM</span><h2>Program</h2></div>
            <span className="panel-count">{FIBONACCI_PROGRAM.words.length} WORDS</span>
          </div>
          <div className="source-list" aria-label="Fibonacci program listing">
            {FIBONACCI_PROGRAM.sourceMap.map((entry) => {
              const isActive = entry.address === activeAddress && selectedRow?.chain.status !== "halted";
              return (
                <div className={`source-row ${isActive ? "active" : ""}`} key={entry.address} aria-current={isActive ? "step" : undefined} title={`ROM address ${entry.address}`}>
                  <span className="source-address">{entry.address.toString().padStart(3, "0")}</span>
                  <span className="source-word">{hex(FIBONACCI_ROM[entry.address] ?? 0, 4)}</span>
                  <span className="source-code">{entry.source}</span>
                  {isActive && <span className="source-cursor" aria-label="program counter">●</span>}
                </div>
              );
            })}
          </div>
          <div className="program-footer"><span>ROM ROOT</span><span className="mono" title={hex(FIBONACCI_ROM_ROOT, 64)}>{ROM_TREE_DESCRIPTION}</span></div>
        </aside>

        <div className="core-column">
          <div className="panel core-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">02 / CORE</span><h2>Machine state</h2></div>
              <span className="live-tag"><span /> {selectedRow === undefined ? "INITIAL" : "CHAIN STATE"}</span>
            </div>
            <div className="instruction-banner">
              <div className="instruction-address">PC {state.pc.toString().padStart(3, "0")}</div>
              <div className="instruction-main"><span className="instruction-word">{hex(activeWord, 4)}</span><strong>{activeMnemonic}</strong></div>
              <div className="instruction-detail">opcode {decoded.opcode.toString(16).toUpperCase()} · operand {hex(decoded.operand, 3)}</div>
            </div>
            <div className="bus-line"><span>FETCH</span><i /><span>DECODE</span><i /><span>EXECUTE</span><i /><span>COMMIT</span></div>
            <div className="core-metrics">
              <Metric label="ACCUMULATOR" value={hex(state.accumulator, 1)} detail={`${binary(state.accumulator, 4)} · 4 BIT`} accent="orange" />
              <Metric label="PROGRAM COUNTER" value={state.pc.toString().padStart(3, "0")} detail="10 BIT ADDRESS" accent="blue" />
              <Metric label="INSTRUCTIONS" value={decimal(state.instructionCount)} detail={`ADVANCE ${decimal(state.advanceCount)}`} accent="green" />
            </div>
            <div className="flags-row">
              <span className="section-label">FLAGS</span>
              <Flag name="Z" active={(state.flags & 1) !== 0} detail="ZERO" />
              <Flag name="C" active={(state.flags & 2) !== 0} detail="CARRY" />
              <span className="status-chip"><span className={`state-led ${state.status === "halted" ? "halted" : "running"}`} /> {machineStateLabel(state.status === "halted")}</span>
            </div>
          </div>

          <div className="panel register-panel">
            <div className="panel-heading compact-heading">
              <div><span className="panel-kicker">03 / REGISTERS</span><h2>Register file</h2></div>
              <span className="panel-count">16 × 4 BIT</span>
            </div>
            <div className="register-grid">
              {state.registers.map((value, index) => (
                <div className={`register-cell ${index === decoded.operand && [2, 3, 4, 5, 6, 7, 8, 9].includes(decoded.opcode) ? "touched" : ""}`} key={index}>
                  <span>R{index}</span><strong>{value.toString(16).toUpperCase()}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="panel ram-panel">
            <div className="panel-heading compact-heading">
              <div><span className="panel-kicker">04 / RAM</span><h2>Memory window</h2></div>
              <span className="panel-count">256 NIBBLES</span>
            </div>
            <div className="ram-grid">
              {Array.from({ length: RAM_WINDOW_SIZE }, (_, index) => (
                <div className={`ram-cell ${index === state.pc ? "touched" : ""}`} key={index}>
                  <span>{index.toString(16).padStart(2, "0")}</span><strong>{(state.ram[index] ?? 0).toString(16).toUpperCase()}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="right-column">
          <div className="panel chain-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">05 / TESTNET</span><h2>Selected transaction</h2></div>
              <span className="verified-tag">READ-ONLY</span>
            </div>
            {selectedRow === undefined ? (
              <p className="empty-state chain-empty">The replay is at the initial state. Select an Advance to inspect its on-chain evidence.</p>
            ) : (
              <>
                <div className="chain-status"><span className="state-led ready" /> INCLUDED IN ACCOUNT HISTORY <a href={selectedRow.chain.transactionUrl} target="_blank" rel="noreferrer">VIEW TX ↗</a></div>
                <div className="chain-facts">
                  <Fact label="ADVANCE" value={`${selectedRow.chain.advanceCount} / 97`} />
                  <Fact label="TRANSACTION" value={shortHash(selectedRow.chain.transactionHash)} title={selectedRow.chain.transactionHash} mono />
                  <Fact label="KEEPER" value={shortAddress(selectedRow.chain.keeperAddress)} title={selectedRow.chain.keeperAddress} mono />
                  <Fact label="FEE" value={formatTon(selectedRow.chain.feeNanoTon)} />
                  <Fact label="INPUT" value={formatTon(selectedRow.chain.inputValueNanoTon)} />
                  <Fact label="OBSERVED" value={selectedRow.chain.observedAt.replace("T", " ").replace(".000Z", " UTC")} mono />
                </div>
                <div className="transaction-note">The contract emitted one <span>CpuAdvanced</span> event for this accepted message. Its hash transition is checked below against the canonical emulator.</div>
              </>
            )}
            <div className="chain-account"><span>CONTRACT</span><a href={TESTNET_RUN.accountUrl} target="_blank" rel="noreferrer" title={TESTNET_RUN.contractAddress}>{shortAddress(TESTNET_RUN.contractAddress)} ↗</a></div>
          </div>

          <div className="panel output-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">06 / EVENTS</span><h2>Output stream</h2></div>
              <span className="panel-count">{outputs.length} / {OUTPUT_SLOT_COUNT}</span>
            </div>
            <div className="output-sequence" aria-label="Output sequence">
              {Array.from({ length: OUTPUT_SLOT_COUNT }, (_, index) => {
                const value = outputs[index];
                return <span className={value === undefined ? "empty" : "filled"} key={index}>{value ?? "·"}</span>;
              })}
            </div>
            <div className="output-progress" role="progressbar" aria-label="Fibonacci output progress" aria-valuemin={0} aria-valuemax={OUTPUT_SLOT_COUNT} aria-valuenow={outputs.length}>
              <span style={{ width: `${(outputs.length / OUTPUT_SLOT_COUNT) * 100}%` }} />
            </div>
            <div className="event-log" aria-live="polite">
              {outputEvents.length === 0 ? (
                <p className="empty-state">No <span>CpuOutput</span> event has occurred at this position.</p>
              ) : outputEvents.slice().reverse().map((trace) => (
                <div className="event-row" key={`${trace.chain.advanceCount}-${trace.chain.output!.outputIndex}`}>
                  <span className="event-index">#{trace.chain.output!.outputIndex}</span>
                  <strong>{trace.chain.output!.value}</strong>
                  <span>at instruction {trace.chain.output!.instructionCount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel proof-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">07 / COMMITMENT</span><h2>State proof</h2></div>
              <span className={selectedRow?.localStateMatchesChain === false ? "error-tag" : "verified-tag"}>{selectedRow === undefined ? "INITIAL" : "MATCH"}</span>
            </div>
            <div className="hash-block">
              <span>CONTRACT EVENT NEXT HASH</span>
              <strong title={currentHash}>{shortHash(currentHash)}</strong>
            </div>
            <div className="hash-flow"><div /><span>COMPARE</span><div /></div>
            <div className="hash-block muted-hash">
              <span>EMULATOR RECONSTRUCTION</span>
              <strong title={selectedRow?.afterHash ?? TESTNET_RUN.commitments.initialCoreStateHash}>{shortHash(selectedRow?.afterHash ?? TESTNET_RUN.commitments.initialCoreStateHash)}</strong>
            </div>
            <div className="hash-block muted-hash">
              <span>STATIC COMMITMENT</span>
              <strong title={hex(FIBONACCI_STATIC_COMMITMENT, 64)}>{shortHash(hex(FIBONACCI_STATIC_COMMITMENT, 64))}</strong>
            </div>
            <div className="proof-footnote">The contract event is the chain observation. Registers, RAM, and flags are the canonical emulator reconstruction for the selected accepted step.</div>
          </div>

          <div className="trust-note"><span className="shield-icon">◇</span><div><strong>Read-only historical snapshot</strong><p>Captured from {TESTNET_RUN.source.provider}. No wallet is connected and no transaction is sent. <a href={TESTNET_RUN.accountUrl} target="_blank" rel="noreferrer">Open the contract ↗</a></p></div></div>
        </aside>
      </section>

      <section className="panel deployment-panel" aria-label="Deployment commitments">
        <div className="panel-heading compact-heading">
          <div><span className="panel-kicker">DEPLOYMENT / STATE-INIT</span><h2>What was deployed</h2></div>
          <span className="panel-count">{TESTNET_RUN.source.transactionCount} TX SNAPSHOT</span>
        </div>
        <div className="deployment-grid">
          <Fact label="DEPLOY TX" value={shortHash(TESTNET_RUN.deployment.transactionHash)} title={TESTNET_RUN.deployment.transactionHash} mono link={TESTNET_RUN.deployment.transactionUrl} />
          <Fact label="CODE HASH" value={shortHash(TESTNET_RUN.deployment.codeHash)} title={TESTNET_RUN.deployment.codeHash} mono />
          <Fact label="DATA HASH" value={shortHash(TESTNET_RUN.deployment.dataHash)} title={TESTNET_RUN.deployment.dataHash} mono />
          <Fact label="ROM ROOT" value={shortHash(TESTNET_RUN.commitments.romRoot)} title={TESTNET_RUN.commitments.romRoot} mono />
          <Fact label="FINAL BALANCE" value={formatTon(TESTNET_RUN.currentAccount.balanceNanoTon)} />
          <Fact label="SNAPSHOT" value={TESTNET_RUN.source.capturedAt.replace("T", " ").replace(".000Z", " UTC")} mono />
        </div>
      </section>

      <footer className="footer"><span>TONOLITH VISUALIZER / TESTNET RUN</span><span>97 ACCEPTED ADVANCES · READ-ONLY · ISA v1</span></footer>
    </main>
  );
}

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return <div className={`metric metric-${accent}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Flag({ name, active, detail }: { name: string; active: boolean; detail: string }) {
  return <div className={`flag ${active ? "active" : ""}`}><strong>{name}</strong><span>{detail}</span></div>;
}

function Fact({ label, value, title, mono = false, link }: { label: string; value: string; title?: string; mono?: boolean; link?: string }) {
  const content = link ? <a href={link} target="_blank" rel="noreferrer" title={title}>{value} ↗</a> : <strong className={mono ? "mono" : ""} title={title}>{value}</strong>;
  return <div className="fact"><span>{label}</span>{content}</div>;
}
