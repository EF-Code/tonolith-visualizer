"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  decodeInstruction,
  disassembleWord,
  executeInstruction,
  type CpuState,
  createInitialState,
  stateHash,
} from "tonolith/browser";
import { FIBONACCI_PROGRAM, FIBONACCI_ROM, FIBONACCI_ROM_ROOT, FIBONACCI_STATIC_COMMITMENT } from "../lib/program";
import { binary, decimal, hex, shortHash } from "../lib/format";
import { OUTPUT_SLOT_COUNT, RAM_WINDOW_SIZE, SPEED_DEFAULT, SPEED_MAX, SPEED_MIN } from "../lib/ui";
import { outputRows, outputValues, type TraceRow } from "../lib/trace";
import { machineStateLabel, runStateLabel } from "../lib/labels";
import { PROGRAM_DESCRIPTION, PROGRAM_NAME, ROM_TREE_DESCRIPTION } from "../lib/program-info";
import { TestnetRunLab } from "./testnet-run";

const INITIAL_STATE = createInitialState();

export type VisualizerMode = "testnet" | "local";

export function CpuLab() {
  const [mode, setMode] = useState<VisualizerMode>("testnet");

  if (mode === "testnet") {
    return <TestnetRunLab onModeChange={setMode} />;
  }

  return <LocalCpuLab onModeChange={setMode} />;
}

function LocalCpuLab({ onModeChange }: { onModeChange: (mode: VisualizerMode) => void }) {
  const [state, setState] = useState<CpuState>(() => createInitialState());
  const [history, setHistory] = useState<TraceRow[]>([]);
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);

  const currentHash = useMemo(() => stateHash(state), [state]);
  const initialHash = useMemo(() => stateHash(INITIAL_STATE), []);
  const halted = state.status === "halted";
  const activeAddress = halted ? history.at(-1)?.address ?? state.pc : state.pc;
  const activeWord = FIBONACCI_ROM[activeAddress] ?? 0;
  const activeMnemonic = disassembleWord(activeWord);
  const decoded = decodeInstruction(activeWord);

  const performStep = useCallback(() => {
    const current = stateRef.current;
    if (current.status === "halted") {
      setRunning(false);
      return;
    }

    try {
      const address = current.pc;
      const word = FIBONACCI_ROM[address] ?? 0;
      const beforeHash = stateHash(current);
      const result = executeInstruction(current, FIBONACCI_ROM);
      const afterHash = stateHash(result.state);
      const row: TraceRow = {
        address,
        word,
        mnemonic: disassembleWord(word),
        beforeHash,
        afterHash,
        instructionCount: result.state.instructionCount,
        ...(result.output === undefined ? {} : { output: result.output }),
      };

      stateRef.current = result.state;
      setState(result.state);
      setHistory((previous) => [...previous, row]);
      setError(null);
      if (result.state.status === "halted") {
        setRunning(false);
      }
    } catch (caught) {
      setRunning(false);
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }, []);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const interval = window.setInterval(performStep, Math.max(70, 1000 / speed));
    return () => window.clearInterval(interval);
  }, [performStep, running, speed]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement) {
        return;
      }
      event.preventDefault();
      performStep();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [performStep]);

  const reset = () => {
    const next = createInitialState();
    stateRef.current = next;
    setState(next);
    setHistory([]);
    setError(null);
    setRunning(false);
  };

  const outputs = outputValues(history);
  const eventRows = outputRows(history);
  const sourceMap = new Map(FIBONACCI_PROGRAM.sourceMap.map((entry) => [entry.address, entry]));

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Tonolith Visualizer home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>TONOLITH <em>VISUALIZER</em></span>
        </a>
        <div className="topbar-meta">
          <span className="network-dot" />
          <button className="mode-button mode-button-active" type="button" aria-pressed="true">LOCAL EMULATOR</button>
          <button className="mode-button" type="button" aria-pressed="false" onClick={() => onModeChange("testnet")}>TESTNET RUN</button>
          <span className="version">ISA v1</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">TONOLITH V1 / LOCAL EMULATOR</p>
          <h1>Trace the CPU<br /><span>one instruction at a time.</span></h1>
          <p className="hero-copy">
            Run the Fibonacci program and inspect the registers, flags, RAM, output
            events, and state hash after each step.
          </p>
        </div>
        <div className="hero-proof">
          <div className="proof-line"><span>PROGRAM</span><strong title={PROGRAM_DESCRIPTION}>{PROGRAM_NAME}</strong></div>
          <div className="proof-line"><span>EXECUTION</span><strong>ONE INSTRUCTION / STEP</strong></div>
          <div className="proof-line"><span>NETWORK</span><strong className="muted-value">LOCAL ONLY</strong></div>
        </div>
      </section>

      <section className="control-strip" aria-label="Execution controls">
        <div className="control-primary">
          <button className="button button-primary" type="button" aria-pressed={running} onClick={() => setRunning((value) => !value)} disabled={halted}>
            <span className="button-icon" aria-hidden="true">{running ? "Ⅱ" : "▶"}</span>
            {running ? "Pause" : "Run program"}
          </button>
          <button className="button button-secondary" type="button" aria-label="Step once" onClick={performStep} disabled={running || halted}>
            Step once <span className="key">SPACE</span>
          </button>
          <button className="button button-quiet" type="button" onClick={reset}>Reset</button>
        </div>
        <label className="speed-control">
          <span>PACE</span>
          <input aria-label="Execution pace in hertz" type="range" min={SPEED_MIN} max={SPEED_MAX} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
          <strong>{speed} Hz</strong>
        </label>
        <div className="run-state" aria-live="polite">
          <span className={`state-led ${halted ? "halted" : running ? "running" : "ready"}`} />
          {runStateLabel(running, halted)}
        </div>
      </section>

      {error !== null && <div className="error-banner" role="alert">Execution stopped: {error}</div>}

      <section className="lab-grid" aria-label="CPU visualization">
        <aside className="panel program-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">01 / ROM</span><h2>Program</h2></div>
            <span className="panel-count">{FIBONACCI_PROGRAM.words.length} WORDS</span>
          </div>
          <div className="source-list" aria-label="Fibonacci program listing">
            {FIBONACCI_PROGRAM.sourceMap.map((entry) => {
              const isActive = entry.address === activeAddress && !halted;
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
              <span className="live-tag"><span /> LIVE</span>
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
              <span className="status-chip"><span className={`state-led ${halted ? "halted" : "running"}`} /> {machineStateLabel(halted)}</span>
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
          <div className="panel output-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">05 / EVENTS</span><h2>Output stream</h2></div>
              <span className="panel-count">{outputs.length} / {OUTPUT_SLOT_COUNT}</span>
            </div>
            <div className="output-sequence" aria-label="Output sequence">
              {Array.from({ length: OUTPUT_SLOT_COUNT }, (_, index) => {
                const value = outputs[index];
                return <span className={value === undefined ? "empty" : "filled"} key={index}>{value ?? "·"}</span>;
              })}
            </div>
            <div className="output-progress" role="progressbar" aria-label="Fibonacci output progress" aria-valuemin={0} aria-valuemax={OUTPUT_SLOT_COUNT} aria-valuenow={outputs.length}>
              <span style={{ width: ((outputs.length / OUTPUT_SLOT_COUNT) * 100) + "%" }} />
            </div>
            <div className="event-log" aria-live="polite">
              {eventRows.length === 0 ? (
                <p className="empty-state">Output events will appear here as <span>SYS OUT</span> commits.</p>
              ) : eventRows.slice().reverse().map((row) => (
                <div className="event-row" key={`${row.instructionCount.toString()}-${row.output?.value}`}>
                  <span className="event-index">#{row.output!.outputIndex.toString()}</span>
                  <strong>{row.output!.value}</strong>
                  <span>at instruction {row.instructionCount.toString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel proof-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">06 / COMMITMENT</span><h2>State proof</h2></div>
              <span className="verified-tag">DETERMINISTIC</span>
            </div>
            <div className="hash-block">
              <span>CURRENT CORE HASH</span>
              <strong title={currentHash}>{shortHash(currentHash)}</strong>
            </div>
            <div className="hash-flow"><div /><span>SHA-256 CELL HASH</span><div /></div>
            <div className="hash-block muted-hash">
              <span>INITIAL CORE HASH</span>
              <strong title={initialHash}>{shortHash(initialHash)}</strong>
            </div>
            <div className="hash-block muted-hash">
              <span>STATIC COMMITMENT</span>
              <strong title={hex(FIBONACCI_STATIC_COMMITMENT, 64)}>{shortHash(hex(FIBONACCI_STATIC_COMMITMENT, 64))}</strong>
            </div>
            <div className="proof-footnote">Every step creates a new committed architectural state. The visualizer is running the same TypeScript reference emulator used by Tonolith’s differential tests.</div>
          </div>

          <div className="trust-note"><span className="shield-icon">◇</span><div><strong>Local-only mode</strong><p>No wallet connected and no transaction is being sent. This view is an unconnected emulator; switch to TESTNET RUN to inspect the recorded chain evidence.</p></div></div>
        </aside>
      </section>

      <footer className="footer"><span>TONOLITH VISUALIZER / LOCAL LAB</span><span>CANONICAL EMULATOR · ISA v1 · MAX ADVANCE 1</span></footer>
    </main>
  );
}

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return <div className={`metric metric-${accent}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Flag({ name, active, detail }: { name: string; active: boolean; detail: string }) {
  return <div className={`flag ${active ? "active" : ""}`}><strong>{name}</strong><span>{detail}</span></div>;
}
