# 0003. Single-round negotiation

## Context
A host proposes times, then a guest may confirm or propose new times.

## Decision
- The flow has one round. Host creates, then guest proposes once.
- When an event is negotiating, the host confirms. When it is pending, the guest confirms. This decides which email is asked for.
- Only a pending event takes a proposal, and the proposer is the guest. `addProposal` rejects the host's email.
- The confirmer's email must differ from the proposer's. `confirmEvent` and `firestore.rules` enforce this.
- When the host rejects the guest's times, the event becomes `closed`. A closed event shows no times to pick.
- `confirmedSlot` cannot be updated after confirmation. This keeps confirmed times secure and prevents accidental changes.

## Consequences
Multi-round negotiation needs a new proposer model.
There are no accounts, so an email check is not identity proof. Anyone with the link can type the other email.
