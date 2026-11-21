# 0003. Single-round negotiation

## Context
A host proposes times, then a guest may confirm or propose new times.

## Decision
- The flow has one round. Host creates, then guest proposes once.
- When an event is negotiating, the host confirms. When it is pending, the guest confirms. This decides which email is asked for.
- When a proposal is added, the proposer is the guest (`proposerEmail` is `guestEmail`).
- `confirmedSlot` cannot be updated after confirmation. This keeps confirmed times secure and prevents accidental changes.

## Consequences
Multi-round negotiation needs a new proposer model. See the open issues about unvalidated confirmer email.
