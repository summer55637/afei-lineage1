# Browser Battle Context Clear Gate

## Boundary

`BATTLE_CONTEXT_CLEAR` is a Browser-runtime lifecycle boundary. It is not presented as a new fixed-C game rule.

The gate accepts a finished Battle Context only when the canonical Persistent State proves this exact chain:

`Settlement Receipt → Player Exit Commit → Pet Exit Commit → Context Clear`

## Required evidence

The current state must contain:

- one settlement receipt in `battleSettlementReceipts`
- one matching Player Exit transaction in `battlePlayerExitTransactions`
- one matching Pet Exit transaction in `battleExitTransactions`
- Player Exit `revisionAfter` equal to Pet Exit `revisionBefore`
- Pet Exit `revisionAfter` equal to the current Persistent State revision
- all settlement identifiers and receipt revisions still match

Missing or ambiguous evidence fails closed.

## Runtime behavior

`BATTLE_EXIT_COMMIT` uses the same gate after a successful Pet Exit commit, so the existing automatic lifecycle remains compatible.

The explicit `BATTLE_CONTEXT_CLEAR` action is also exposed by the Browser State Controller. It performs only transient context clearing; it does not modify Persistent State, rewards, EXP, Gold, Item, or RNG.

## Fixed source boundary

The underlying battle exit semantics remain tied to the existing pinned source audit:

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

This Browser gate only enforces lifecycle ordering around the already-closed Player/Pet Exit transactions.
