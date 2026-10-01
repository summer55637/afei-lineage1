# Browser State Controller Dispatch Serialization

## Purpose

This is Browser controller concurrency hardening, not a new fixed-C game rule.

createBrowserStateController().dispatch() now serializes calls through a small Promise tail. The goal is to prevent two asynchronous UI/runtime actions from reading the same currentState.revision before either action has committed.

## Boundary

Before: dispatch(A) and dispatch(B) could both enter an async runtime while currentState still pointed at revision N.

After: dispatch(A) is queued before dispatch(B); B starts only after A resolves or rejects. A rejection does not permanently block the queue.

This protects controller actions that mutate currentState, including the world-loop and battle settlement/exit chain.

The existing per-runtime expectedRevision checks remain in place. Serialization is an additional controller-level ordering guarantee; it does not replace revision validation.

## Regression

tools/check_v426_browser_state_controller_dispatch_serialization.mjs verifies concurrent duplicate encounter commits cannot both mutate the same revision, and an explicit stale expectedRevision remains revision-conflict.

No RNG, reward, Gold, EXP, Item, or fixed-C battle rule is changed by this hardening.