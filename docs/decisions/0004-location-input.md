# 0004. Location input with Places autocomplete

## Context
`LocationInput` wraps `google.maps.places.PlaceAutocompleteElement`. It needs the "Places API (New)" enabled for the API key's project.

## Decision
- A module-level singleton loads Google Maps once, however many instances mount. It reuses a loader that a previous mount added.
- The component has three states: `loading` (waiting for the Places library), `ready` (element mounted), `fallback` (plain input, when no key or the API is unavailable).
- A flag records that the user picked a place through the widget. Then the "current value" hint, used when editing an event, hides.
- The widget handles both event shapes: `{ placePrediction }` (current API) and `{ place }` (older loader versions).
- The widget is not a native form control. `EventForm` validates the location by hand.

## Consequences
Without a key the form still works with free text.
