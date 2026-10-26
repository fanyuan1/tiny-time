// Events this device created or opened, so users can find them again without email.
// Stored locally because the app has no accounts.
const KEY = "tinytime:myEvents";
const MAX_EVENTS = 20;

export const getMyEvents = () => {
    try {
        const list = JSON.parse(localStorage.getItem(KEY)) || [];
        return list.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
        return [];
    }
};

const write = (list) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
        // Private mode or full storage: the list is a convenience, so ignore.
    }
};

/** Insert or update an event. The first role recorded wins, so a host stays a host. */
export const saveMyEvent = (event, role) => {
    const list = getMyEvents();
    const existing = list.find((e) => e.id === event.id);
    const entry = {
        ...existing,
        id: event.id,
        title: event.title ?? existing?.title,
        status: event.status ?? existing?.status,
        start: event.confirmedSlot?.start ?? existing?.start ?? null,
        role: existing?.role || role,
        updatedAt: Date.now(),
    };
    // Capped since entries can't be removed; the oldest drop off.
    write([entry, ...list.filter((e) => e.id !== event.id)].slice(0, MAX_EVENTS));
};
