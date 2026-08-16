# Future testnet read model

A future chain-facing view should start read-only. It may show:

- the deployed Tonolith contract address;
- code and data commitment values;
- accepted transaction identifiers;
- inclusion and finality evidence;
- observed fees and storage balance;
- keeper and stale-message observations.

Each value must carry its source and observation time. Local emulator values and
testnet values must never share an unlabeled status component. No wallet is
needed to render public chain evidence.
