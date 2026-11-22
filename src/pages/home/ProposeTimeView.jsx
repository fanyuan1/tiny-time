import { useEvent } from "@/context/EventContext";
import { addProposal } from "@/lib/db";
import { saveMyEvent } from "@/lib/myEvents";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const sendProposal = async ({ eventData, proposalSlots, proposerEmail, dispatch, setLoading }) => {
    if (!proposerEmail) {
        alert("Please enter your email.");
        return;
    }
    setLoading(true);
    try {
        await addProposal(eventData.id, proposalSlots, proposerEmail, eventData.duration);
        saveMyEvent({ id: eventData.id, status: "negotiating" }, "guest");
        dispatch({ type: "SET_MODE", payload: "proposal_sent" });
    } catch (e) {
        console.error(e);
        alert(`Error: ${e.message}`);
    } finally {
        setLoading(false);
    }
};

function EmailField({ value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your Email</label>
            <Input
                placeholder="your@example.com"
                type="email"
                required
                pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                title="Please enter a valid email address"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
                We'll send a confirmation email to this address.
            </p>
        </div>
    );
}

export function ProposeTimeView({ proposalSlots, setProposalSlots, setLoading }) {
    const { state, dispatch } = useEvent();
    const { eventData } = state;
    const proposerEmail = eventData.guestEmail || "";
    const handleChange = (slots, duration) => {
        setProposalSlots(slots);
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
                selectedSlots={proposalSlots}
                initialDuration={eventData.duration}
                onChange={handleChange}
                busySlots={[]}
            />

            <div className="flex flex-col gap-3">
                <EmailField
                    value={proposerEmail}
                    onChange={(guestEmail) => dispatch({ type: "UPDATE_EVENT_DATA", payload: { guestEmail } })}
                />
                <Button
                    onClick={() => sendProposal({ eventData, proposalSlots, proposerEmail, dispatch, setLoading })}
                    disabled={proposalSlots.length === 0 || !proposerEmail}
                    className="w-full"
                >
                    Send Proposal
                </Button>
                <Button variant="ghost" onClick={() => dispatch({ type: "SET_MODE", payload: "view" })} className="w-full">
                    Back
                </Button>
            </div>
        </div>
    );
}
