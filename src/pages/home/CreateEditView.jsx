import { useNavigate } from "react-router-dom";
import { useEvent } from "@/context/EventContext";
import { updateEventDetails } from "@/lib/db";
import { EventForm } from "@/components/EventForm";
import { MyEventsList } from "@/components/MyEventsList";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

function CreateHeading() {
    return (
        <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 text-balance">
                Schedule playdates{" "}
                <span className="bg-linear-to-r from-primary to-brand-sky bg-clip-text text-transparent">effortlessly</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto text-pretty">
                Share when you're free. The other parent picks a time. No sign-up.
            </p>
        </div>
    );
}

function EditHeading() {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold">Edit Event Details</h2>
            <p className="text-muted-foreground mt-2">Update your event information</p>
        </div>
    );
}

const leaveEdit = (eventData, dispatch, navigate) => {
    if (eventData.status === 'confirmed') {
        navigate(`/?eventId=${eventData.id}`);
    } else {
        dispatch({ type: "SET_MODE", payload: "view" });
    }
};

const saveEdit = async ({ eventData, data, dispatch, navigate, setLoading }) => {
    setLoading(true);
    try {
        await updateEventDetails(eventData.id, data);
        dispatch({ type: "UPDATE_EVENT_DATA", payload: data });
        leaveEdit(eventData, dispatch, navigate);
    } catch (e) {
        console.error(e);
        alert("Failed to update event.");
    } finally {
        setLoading(false);
    }
};

export function CreateEditView({ prefillKey, setLoading }) {
    const { state, dispatch } = useEvent();
    const navigate = useNavigate();
    const { eventData } = state;
    const isEditing = state.mode === "edit_event";
    const handleSubmit = async (data) => {
        if (isEditing) {
            await saveEdit({ eventData, data, dispatch, navigate, setLoading });
            return;
        }
        dispatch({ type: "UPDATE_EVENT_DATA", payload: data });
        dispatch({ type: "SET_MODE", payload: "pick_time" });
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8">
            {isEditing ? <EditHeading /> : <CreateHeading />}
            <Card>
                <CardContent className="pt-5 sm:pt-6">
                    <EventForm key={prefillKey} onSubmit={handleSubmit} initialData={eventData || {}} isEditing={isEditing} />
                    {isEditing && (
                        <Button variant="ghost" onClick={() => leaveEdit(eventData, dispatch, navigate)} className="w-full mt-4">
                            Back
                        </Button>
                    )}
                </CardContent>
            </Card>
            {!isEditing && <MyEventsList />}
        </div>
    );
}
