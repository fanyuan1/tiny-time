import { useNavigate } from "react-router-dom";
import { format, addMinutes } from "date-fns";
import { useEvent } from "@/context/EventContext";
import { closeEvent } from "@/lib/db";
import { saveMyEvent } from "@/lib/myEvents";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pencil, ChevronRight, Mail, MapPin, AlignLeft } from "lucide-react";

function DetailRow({ Icon, children }) {
    return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
            <Icon className="w-4 h-4 text-blue-600" /> {children}
        </div>
    );
}

function EventDetailsCard({ eventData, onEdit }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle>{eventData.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onEdit}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <DetailRow Icon={Mail}>Host: {eventData.hostEmail}</DetailRow>
                <DetailRow Icon={Mail}>Guest: {eventData.guestEmail || "TBD"}</DetailRow>
                <DetailRow Icon={MapPin}>{eventData.location || "Location: TBD"}</DetailRow>
                {eventData.description ? (
                    <DetailRow Icon={AlignLeft}>Description: {eventData.description}</DetailRow>
                ) : (
                    <p className="text-sm text-gray-500"></p>
                )}
            </CardContent>
        </Card>
    );
}

function StatusBanner({ eventData }) {
    if (eventData.status === "negotiating") {
        return (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-700">
                    New proposal! <span className="font-bold">{eventData.guestEmail}</span> suggested these times.
                </p>
            </div>
        );
    }
    if (eventData.status === "closed") {
        return (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <p className="text-sm text-gray-700">
                    The host closed this invite because none of the proposed times worked.
                </p>
            </div>
        );
    }
    return null;
}

function SlotButton({ slot, duration, onSelect }) {
    const start = new Date(slot.start);
    return (
        <Button
            variant="outline"
            className="justify-between h-auto py-3 hover:bg-blue-50 hover:border-blue-200 border-l-4 border-l-blue-600"
            onClick={onSelect}
        >
            <div className="text-left">
                <div className="font-medium text-gray-900">{format(start, "EEEE, MMMM do")}</div>
                <div className="text-sm text-gray-500">
                    {format(start, "h:mm a")} - {format(addMinutes(start, duration || 30), "h:mm a")}
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
        </Button>
    );
}

function NoneWorkAction({ onClick, children }) {
    return (
        <div className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground text-center">None of the times work?</p>
            <Button variant="outline" className="w-full bg-gray-50 hover:bg-gray-100" onClick={onClick}>
                {children}
            </Button>
        </div>
    );
}

const closeAndRestart = async (eventData, navigate) => {
    if (!confirm("This will close this invite and start a new one. Proceed?")) return;
    try {
        await closeEvent(eventData.id);
        saveMyEvent({ id: eventData.id, status: "closed" }, "host");
        navigate("/");
    } catch (e) {
        console.error(e);
        alert(`Error: ${e.message}`);
    }
};

export function EventView() {
    const { state, dispatch } = useEvent();
    const navigate = useNavigate();
    const { eventData } = state;
    if (!eventData || !eventData.title) {
        return (
            <div className="text-center p-8">
                <p>Loading event data...</p>
            </div>
        );
    }

    const isNegotiating = eventData.status === "negotiating";
    const isClosed = eventData.status === "closed";
    const slotsToShow = isClosed ? [] : state.selectedSlots || [];
    const selectSlot = (slot) => {
        dispatch({ type: "SET_SLOTS", payload: [slot] });
        dispatch({ type: "UPDATE_EVENT_DATA", payload: { guestEmail: eventData.guestEmail || "" } });
        dispatch({ type: "SET_MODE", payload: "confirm_booking" });
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <EventDetailsCard eventData={eventData} onEdit={() => dispatch({ type: "SET_MODE", payload: "edit_event" })} />
            <StatusBanner eventData={eventData} />
            <div className="flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-4">Select a Time</h3>
                <div className="sm:max-h-96 sm:overflow-y-auto grid grid-cols-1 gap-2 sm:pr-2">
                    {slotsToShow.map((slot, i) => (
                        <SlotButton key={i} slot={slot} duration={eventData.duration} onSelect={() => selectSlot(slot)} />
                    ))}
                </div>
                {isNegotiating && (
                    <NoneWorkAction onClick={() => closeAndRestart(eventData, navigate)}>Create a New Invite</NoneWorkAction>
                )}
                {!isNegotiating && !isClosed && (
                    <NoneWorkAction onClick={() => dispatch({ type: "SET_MODE", payload: "propose_time" })}>Propose New Times</NoneWorkAction>
                )}
            </div>
        </div>
    );
}
