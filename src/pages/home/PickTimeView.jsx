import { useEvent } from "@/context/EventContext";
import { createEvent } from "@/lib/db";
import { saveMyEvent } from "@/lib/myEvents";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { Button } from "@/components/ui/Button";
import { STICKY_ACTIONS } from "./stickyActions";

const publish = async ({ state, dispatch, setLoading, setShareUrl }) => {
    setLoading(true);
    try {
        const eventPayload = {
            ...state.eventData,
            proposedSlots: state.selectedSlots,
            duration: state.eventData.duration || 30,
        };
        const newEventId = await createEvent(eventPayload);
        saveMyEvent({ id: newEventId, title: eventPayload.title, status: "pending" }, "host");
        setShareUrl(`${window.location.origin}/?eventId=${newEventId}`);
        dispatch({ type: "SET_MODE", payload: "share" });
    } catch (error) {
        console.error("Failed to create event", error);
        alert("Failed to create event. Please try again.");
    } finally {
        setLoading(false);
    }
};

export function PickTimeView({ setLoading, setShareUrl }) {
    const { state, dispatch } = useEvent();
    const slotCount = state.selectedSlots.length;
    const handleChange = (slots, duration) => {
        dispatch({ type: "SET_SLOTS", payload: slots });
        if (duration) {
            dispatch({ type: "UPDATE_EVENT_DATA", payload: { duration } });
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Select Available Times</h2>
                <p className="text-gray-500">Choose all times that work for you</p>
            </div>

            <TimeSlotPicker
                selectedSlots={state.selectedSlots}
                initialDuration={state.eventData.duration}
                onChange={handleChange}
                busySlots={[]}
            />

            <div className={`flex flex-row-reverse gap-2 ${STICKY_ACTIONS}`}>
                <Button
                    onClick={() => publish({ state, dispatch, setLoading, setShareUrl })}
                    disabled={slotCount === 0}
                    className="flex-1"
                >
                    Create &amp; Share Event
                    {slotCount > 0 && ` (${slotCount})`}
                </Button>
                <Button variant="outline" onClick={() => dispatch({ type: "SET_MODE", payload: "create" })}>
                    Back
                </Button>
            </div>
        </div>
    );
}
