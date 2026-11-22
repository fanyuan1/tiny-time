import { useNavigate } from "react-router-dom";
import { format, addMinutes } from "date-fns";
import { useEvent } from "@/context/EventContext";
import { confirmEvent, confirmerRole } from "@/lib/db";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const confirm = async ({ eventData, slot, email, navigate, setLoading }) => {
    setLoading(true);
    try {
        await confirmEvent(eventData.id, slot, email);
        navigate(`/?eventId=${eventData.id}`, { replace: true });
    } catch (e) {
        console.error(e);
        alert(`Error: ${e.message}`);
        setLoading(false);
    }
};

function SlotSummary({ slot, duration }) {
    const start = new Date(slot.start);
    return (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <p className="font-medium text-blue-900">{format(start, "EEEE, MMMM do")}</p>
            <p className="text-blue-700">
                {format(start, "h:mm a")} - {format(addMinutes(start, duration || 30), "h:mm a")}
            </p>
        </div>
    );
}

export function ConfirmBookingView({ setLoading }) {
    const { state, dispatch } = useEvent();
    const navigate = useNavigate();
    const { eventData } = state;
    const slot = state.selectedSlots[0];
    const isHostConfirming = confirmerRole(eventData) === "host";
    const emailField = isHostConfirming ? "hostEmail" : "guestEmail";
    const confirmingEmail = eventData[emailField] || "";

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Confirm Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <SlotSummary slot={slot} duration={eventData.duration} />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Your Email</label>
                    <Input
                        placeholder="your@example.com"
                        type="email"
                        required
                        pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                        title="Please enter a valid email address"
                        value={confirmingEmail}
                        onChange={(e) => dispatch({ type: "UPDATE_EVENT_DATA", payload: { [emailField]: e.target.value } })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        We'll send a confirmation email to this address.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button
                        className="w-full"
                        disabled={!confirmingEmail}
                        onClick={() => confirm({ eventData, slot, email: confirmingEmail, navigate, setLoading })}
                    >
                        Confirm Booking
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                            dispatch({ type: "SET_SLOTS", payload: state.originalProposedSlots });
                            dispatch({ type: "SET_MODE", payload: "view" });
                        }}
                    >
                        Back
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
