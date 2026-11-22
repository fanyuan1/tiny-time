import { useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useEvent } from "@/context/EventContext";
import { getEvent } from "@/lib/db";
import { saveMyEvent } from "@/lib/myEvents";

const loadedMode = (event, urlMode) => {
    if (urlMode === "edit") return "edit_event";
    if (event.status === "confirmed") return "confirmed_view";
    return "view";
};

const failToCreate = (dispatch, message) => {
    dispatch({ type: "SET_MODE", payload: "create" });
    alert(message);
};

const loadEvent = async ({ eventId, urlMode, dispatch, setLoading }) => {
    setLoading(true);
    try {
        const event = await getEvent(eventId);
        if (!event) {
            console.error("Event not found:", eventId);
            failToCreate(dispatch, "Event not found!");
            return;
        }
        saveMyEvent(event, "guest");
        dispatch({ type: "LOAD_EVENT", payload: { eventData: event, selectedSlots: event.proposedSlots || [], mode: loadedMode(event, urlMode) } });
    } catch (error) {
        console.error("Failed to load event", error);
        failToCreate(dispatch, "Failed to load event. Please try again.");
    } finally {
        setLoading(false);
    }
};

const sharedText = (searchParams) =>
    ["title", "text", "url"].map((k) => searchParams.get(k)).filter(Boolean).join(" ");

const redirectShared = (shared, navigate) => {
    const linkedEventId = shared.match(/[?&]eventId=([\w-]+)/)?.[1];
    if (linkedEventId) {
        navigate(`/?eventId=${linkedEventId}`, { replace: true });
        return;
    }
    const email = shared.match(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
    const prefill = { guestEmail: email || "", description: (email ? shared.replace(email, "") : shared).trim() };
    navigate("/", { replace: true, state: { prefill } });
};

export const useEventLoader = ({ setLoading, setPrefillKey }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { dispatch } = useEvent();
    const eventId = searchParams.get("eventId");
    const urlMode = searchParams.get("mode");

    useEffect(() => {
        if (eventId) {
            loadEvent({ eventId, urlMode, dispatch, setLoading });
            return;
        }
        const shared = sharedText(searchParams);
        if (shared) {
            redirectShared(shared, navigate);
            return;
        }
        dispatch({ type: "RESET" });
        if (location.state?.prefill) {
            dispatch({ type: "UPDATE_EVENT_DATA", payload: location.state.prefill });
        }
        setPrefillKey((k) => k + 1);
        setLoading(false);
    }, [eventId, urlMode, location.key, location.state, searchParams, navigate, dispatch, setLoading, setPrefillKey]);
};
