# 0002. Keep the "my events" list on the device

## Context
The app has no accounts. Users need to find events they created or opened without searching their email.

## Decision
`src/lib/myEvents.js` stores the list in localStorage.
- The first role recorded wins, so a host stays a host.
- The list is capped, because entries cannot be removed. The oldest entries drop off.
- Write errors (private mode, full storage) are ignored. The list is a convenience.
- Status in the list is a snapshot from the last time the event was opened on this device.

## Consequences
The list does not follow the user to another device. Statuses can be out of date.
