import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/context/EventContext";
import { createEvent, getEvent, updateEventStatus, addProposal, updateEventDetails } from "@/lib/db";
import { EventForm } from "@/components/EventForm";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { NotifyButton } from "@/components/NotifyButton";
import { MyEventsList } from "@/components/MyEventsList";
import { saveMyEvent } from "@/lib/myEvents";
import { canNativeShare, nativeShare, copyText } from "@/lib/share";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Share2, Check, Calendar, Link as LinkIcon, MapPin, Clock, Pencil, ChevronRight, Mail, AlignLeft } from "lucide-react";
import { format, addMinutes } from "date-fns";
import Confirmation from "./Confirmation";

const STICKY_ACTIONS = "sticky bottom-0 z-10 -mx-4 -mb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:mb-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-white/85 backdrop-blur-md border-t border-slate-200/70 sm:static sm:mx-0 sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0";

export default function Home() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const eventId = searchParams.get("eventId");
    const urlMode = searchParams.get("mode");
    const { state, dispatch } = useEvent();
    const [loading, setLoading] = useState(!!eventId);
    const [shareUrl, setShareUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const [proposalSlots, setProposalSlots] = useState([]);
    const [prefillKey, setPrefillKey] = useState(0);

    useEffect(() => {
        if (eventId) {
            setLoading(true);
            const loadEvent = async () => {
                try {
                    const event = await getEvent(eventId);
                    if (event) {
                        saveMyEvent(event, "guest");
                        if (urlMode === "edit") {
                            dispatch({ type: "LOAD_EVENT", payload: { eventData: event, selectedSlots: event.proposedSlots || [], mode: "edit_event" } });
                        } else if (event.status === 'confirmed') {
                            dispatch({ type: "LOAD_EVENT", payload: { eventData: event, selectedSlots: event.proposedSlots || [], mode: "confirmed_view" } });
                        } else {
                            dispatch({ type: "LOAD_EVENT", payload: { eventData: event, selectedSlots: event.proposedSlots || [], mode: "view" } });
                        }
                    } else {
                        console.error("Event not found:", eventId);
                        dispatch({ type: "SET_MODE", payload: "create" });
                        alert("Event not found!");
                    }
                } catch (error) {
                    console.error("Failed to load event", error);
                    dispatch({ type: "SET_MODE", payload: "create" });
                    alert("Failed to load event. Please try again.");
                } finally {
                    setLoading(false);
                }
            };
            loadEvent();
        } else {
            const shared = ["title", "text", "url"].map((k) => searchParams.get(k)).filter(Boolean).join(" ");
            if (shared) {
                const linkedEventId = shared.match(/[?&]eventId=([\w-]+)/)?.[1];
                if (linkedEventId) {
                    navigate(`/?eventId=${linkedEventId}`, { replace: true });
                    return;
                }
                const email = shared.match(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
                dispatch({
                    type: "UPDATE_EVENT_DATA",
                    payload: { guestEmail: email || "", description: (email ? shared.replace(email, "") : shared).trim() },
                });
                setPrefillKey((k) => k + 1);
                navigate("/", { replace: true });
            }
            dispatch({ type: "SET_MODE", payload: "create" });
            setLoading(false);
        }
    }, [eventId, urlMode, dispatch]);

    const handleCreateEvent = async (formData) => {
        dispatch({ type: "UPDATE_EVENT_DATA", payload: formData });
        dispatch({ type: "SET_MODE", payload: "pick_time" });
    };

    const handlePublish = async () => {
        setLoading(true);
        try {
            const duration = state.eventData.duration || 30;

            const eventPayload = {
                ...state.eventData,
                proposedSlots: state.selectedSlots,
                duration: duration,
            };

            const newEventId = await createEvent(eventPayload);
            saveMyEvent({ id: newEventId, title: eventPayload.title, status: "pending" }, "host");
            const url = `${window.location.origin}/?eventId=${newEventId}`;
            setShareUrl(url);
            dispatch({ type: "SET_MODE", payload: "share" });
        } catch (error) {
            console.error("Failed to create event", error);
            alert("Failed to create event. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copyWithFeedback = async (text) => {
        if (await copyText(text)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const inviteText = `You're invited to ${state.eventData?.title || 'a playdate'}! View details & RSVP:`;
    const handleCopyLink = () => copyWithFeedback(`${inviteText} ${shareUrl}`);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (state.mode === "confirmed_view") {
        return <Confirmation eventData={state.eventData} />;
    }

    if (state.mode === "pick_time") {
        return (
            <div className="w-full max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Select Available Times</h2>
                    <p className="text-gray-500">Choose all times that work for you</p>
                </div>

                <TimeSlotPicker
                    selectedSlots={state.selectedSlots}
                    initialDuration={state.eventData.duration}
                    onChange={(slots, duration) => {
                        dispatch({ type: "SET_SLOTS", payload: slots });
                        if (duration) {
                            dispatch({ type: "UPDATE_EVENT_DATA", payload: { duration } });
                        }
                    }}
                    busySlots={[]}

                />

                <div className={`flex flex-row-reverse gap-2 ${STICKY_ACTIONS}`}>


                    <Button
                        onClick={handlePublish}
                        disabled={state.selectedSlots.length === 0}
                        className="flex-1"
                    >
                        Create &amp; Share Event
                        {state.selectedSlots.length > 0 && ` (${state.selectedSlots.length})`}
                    </Button>
                    <Button variant="outline" onClick={() => dispatch({ type: "SET_MODE", payload: "create" })}>
                        Back
                    </Button>
                </div>
            </div>
        );
    }

    if (state.mode === "share") {
        return (
            <Card className="w-full max-w-3xl mx-auto text-center">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Share2 className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle>Event Created!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">Share this link with the other parent to pick a time.</p>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-2 text-sm text-gray-600 truncate">
                            {shareUrl}
                        </div>
                        <Button size="icon" variant="outline" onClick={handleCopyLink}>
                            {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                        </Button>
                    </div>

                    {canNativeShare() && (
                        <Button className="w-full" onClick={() => nativeShare({ title: state.eventData?.title, text: inviteText, url: shareUrl })}>
                            <Share2 className="w-4 h-4 mr-2" /> Share invite
                        </Button>
                    )}

                    <NotifyButton eventId={shareUrl.split("eventId=")[1]} role="host" label="Notify me when they respond" />

                    <Button className="w-full" variant={canNativeShare() ? "outline" : "default"} onClick={() => navigate(shareUrl.replace(window.location.origin, ''))}>
                        View Event
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (state.mode === "view") {
        if (!state.eventData || !state.eventData.title) {
            return (
                <div className="text-center p-8">
                    <p>Loading event data...</p>
                </div>
            );
        }

        const isNegotiating = state.eventData.status === "negotiating";
        const slotsToShow = state.selectedSlots || [];

        return (
            <div className="w-full max-w-3xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                {state.isEditingEvent ? (
                                    <Input
                                        value={state.eventData.title}
                                        onChange={(e) => dispatch({ type: "UPDATE_EVENT_DATA", payload: { title: e.target.value } })}
                                        className="font-semibold text-xl mb-2"
                                    />
                                ) : (
                                    <CardTitle>{state.eventData.title}</CardTitle>
                                )}
                            </div>
                            {!state.isEditingEvent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        dispatch({ type: "SET_MODE", payload: "edit_event" });
                                    }}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-4 h-4 text-blue-600" /> Host: {state.eventData.hostEmail}
                        </div>
                        {state.eventData.guestEmail ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="w-4 h-4 text-blue-600" /> Guest: {state.eventData.guestEmail}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="w-4 h-4 text-blue-600" /> Guest: TBD
                            </div>
                        )}
                        {state.eventData.location ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4 text-blue-600" /> {state.eventData.location}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4 text-blue-600" /> Location: TBD
                            </div>
                        )}
                        {state.eventData.description ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <AlignLeft className="w-4 h-4 text-blue-600" /> Description: {state.eventData.description}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500"></p>
                        )}
                    </CardContent>
                </Card>

                {isNegotiating && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                        <p className="text-sm text-blue-700">
                            New proposal! <span className="font-bold">{state.eventData.guestEmail}</span> suggested these times.
                        </p>
                    </div>
                )}

                <div className="flex flex-col">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        {isNegotiating ? "Select a Time" : "Select a Time"}
                    </h3>

                    <div className="sm:max-h-96 sm:overflow-y-auto grid grid-cols-1 gap-2 sm:pr-2">
                        {slotsToShow.map((slot, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                className="justify-between h-auto py-3 hover:bg-blue-50 hover:border-blue-200 border-l-4 border-l-blue-600"
                                onClick={() => {
                                    dispatch({ type: "SET_SLOTS", payload: [slot] });
                                    dispatch({ type: "UPDATE_EVENT_DATA", payload: { guestEmail: state.eventData.guestEmail || "" } });
                                    dispatch({ type: "SET_MODE", payload: "confirm_booking" });
                                }}
                            >
                                <div className="text-left">
                                    <div className="font-medium text-gray-900">
                                        {format(new Date(slot.start), "EEEE, MMMM do")}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {format(new Date(slot.start), "h:mm a")} - {format(addMinutes(new Date(slot.start), state.eventData.duration || 30), "h:mm a")}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Button>
                        ))}
                    </div>

                    {isNegotiating && (
                        <div className="pt-4 space-y-2">
                            <p className="text-sm text-muted-foreground text-center">
                                None of the times work?
                            </p>
                            <Button
                                variant="outline"
                                className="w-full bg-gray-50 hover:bg-gray-100"
                                onClick={() => {
                                    if (confirm("This will start a new invite. Proceed?")) {
                                        navigate("/");
                                    }
                                }}
                            >
                                Create a New Invite
                            </Button>
                        </div>
                    )}

                    {!isNegotiating && (
                        <div className="pt-4 space-y-2">
                            <p className="text-sm text-muted-foreground text-center">
                                None of the times work?
                            </p>
                            <Button
                                variant="outline"
                                className="w-full bg-gray-50 hover:bg-gray-100"
                                onClick={() => {
                                    dispatch({ type: "SET_MODE", payload: "propose_time" });
                                }}
                            >
                                Propose New Times
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (state.mode === "confirm_booking") {
        const slot = state.selectedSlots[0];
        const isNegotiating = state.eventData.status === "negotiating";
        const hostEmail = state.eventData.hostEmail;


        const confirmingEmail = isNegotiating ? hostEmail : (state.eventData.guestEmail || "");


        return (
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Confirm Booking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <p className="font-medium text-blue-900">
                            {format(new Date(slot.start), "EEEE, MMMM do")}
                        </p>
                        <p className="text-blue-700">
                            {format(new Date(slot.start), "h:mm a")} - {format(addMinutes(new Date(slot.start), state.eventData.duration || 30), "h:mm a")}

                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Your Email</label>
                        <Input
                            placeholder="your@example.com"
                            type="email"
                            required
                            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                            title="Please enter a valid email address"
                            value={confirmingEmail || ""}
                            onChange={(e) => {
                                if (isNegotiating) {
                                    dispatch({ type: "UPDATE_EVENT_DATA", payload: { hostEmail: e.target.value } });
                                } else {
                                    dispatch({ type: "UPDATE_EVENT_DATA", payload: { guestEmail: e.target.value } });
                                }
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            We'll send a confirmation email to this address.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            className="w-full"
                            disabled={!confirmingEmail}
                            onClick={async () => {



                                setLoading(true);
                                try {
                                    await updateEventStatus(state.eventData.id, "confirmed", slot, confirmingEmail);

                                    window.location.href = `/?eventId=${state.eventData.id}`;
                                } catch (e) {
                                    console.error(e);
                                    alert(`Error: ${e.message}`);
                                    setLoading(false);
                                }
                            }}
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

    if (state.mode === "propose_time") {
        const proposerEmail = state.eventData.guestEmail || "";

        return (
            <div className="w-full max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Select Available Times</h2>
                    <p className="text-gray-500">Choose all times that work for you</p>
                </div>

                <TimeSlotPicker
                    selectedSlots={proposalSlots}
                    initialDuration={state.eventData.duration}
                    onChange={(slots, duration) => {
                        setProposalSlots(slots);
                        if (duration) {
                            dispatch({ type: "UPDATE_EVENT_DATA", payload: { duration } });
                        }
                    }}
                    busySlots={[]}
                />

                <div className="flex flex-col gap-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Your Email</label>
                        <Input
                            placeholder="your@example.com"
                            type="email"
                            required
                            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                            title="Please enter a valid email address"
                            value={proposerEmail}
                            onChange={(e) => {
                                dispatch({ type: "UPDATE_EVENT_DATA", payload: { guestEmail: e.target.value } });
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            We'll send a confirmation email to this address.
                        </p>
                    </div>

                    <Button
                        onClick={async () => {
                            if (!proposerEmail) {
                                alert("Please enter your email.");
                                return;
                            }
                            setLoading(true);
                            try {
                                await addProposal(
                                    state.eventData.id,
                                    proposalSlots,
                                    proposerEmail,
                                    state.eventData.duration
                                );
                                saveMyEvent({ id: state.eventData.id, status: "negotiating" }, "guest");
                                dispatch({ type: "SET_MODE", payload: "proposal_sent" });
                            } catch (e) {
                                console.error(e);
                                alert("Failed to send proposal.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={proposalSlots.length === 0 || !proposerEmail}
                        className="w-full"
                    >
                        Send Proposal
                    </Button>
                    <Button variant="ghost" onClick={() => dispatch({ type: "SET_MODE", payload: "view" })} className="w-full">
                        Back
                    </Button>
                </div>
            </div >
        );
    }

    if (state.mode === "proposal_sent") {
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?eventId=${state.eventData.id}` : "";
        const proposalText = `New time(s) proposed for ${state.eventData?.title || 'your playdate'}! View details & confirm:`;

        return (
            <Card className="w-full max-w-3xl mx-auto text-center">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Share2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle>Proposal Sent!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">The host has been notified of your proposed times.</p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Share this event</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-2 text-sm text-gray-600 truncate text-left">
                                {shareUrl}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyWithFeedback(`${proposalText} ${shareUrl}`)}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {canNativeShare() && (
                        <Button className="w-full" onClick={() => nativeShare({ title: state.eventData?.title, text: proposalText, url: shareUrl })}>
                            <Share2 className="w-4 h-4 mr-2" /> Share with host
                        </Button>
                    )}

                    <NotifyButton eventId={state.eventData.id} role="guest" label="Notify me when the host confirms" />

                    <Button className="w-full" variant={canNativeShare() ? "outline" : "default"} onClick={() => window.location.reload()}>
                        Back to Event
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (state.mode === "waiting_response") {
        const waitingFor = state.eventData.status === "negotiating" ? "host" : "guest";

        return (
            <Card className="w-full max-w-3xl mx-auto text-center">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <CardTitle>Waiting for Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        The {waitingFor} has not responded yet. You'll be notified when they confirm or propose new times.
                    </p>
                    <Button
                        className="w-full"
                        onClick={() => {
                            dispatch({ type: "SET_SLOTS", payload: state.originalProposedSlots });
                            dispatch({ type: "SET_MODE", payload: "view" });
                        }}
                    >
                        Back to Event
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (state.mode === "create" || state.mode === "edit_event") {
        const isEditing = state.mode === "edit_event";

        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8">
                {!isEditing && (
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 text-balance">
                            Schedule playdates{" "}
                            <span className="bg-linear-to-r from-primary to-brand-sky bg-clip-text text-transparent">effortlessly</span>
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto text-pretty">
                            Share when you're free. The other parent picks a time. No sign-up.
                        </p>
                    </div>
                )}
                {isEditing && (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Edit Event Details</h2>
                        <p className="text-muted-foreground mt-2">Update your event information</p>
                    </div>
                )}
                <Card>
                    <CardContent className="pt-5 sm:pt-6">
                        <EventForm
                            key={prefillKey}
                            onSubmit={async (data) => {
                                if (isEditing) {
                                    setLoading(true);
                                    try {
                                        await updateEventDetails(state.eventData.id, data);
                                        dispatch({ type: "UPDATE_EVENT_DATA", payload: data });
                                        
                                        if (state.eventData.status === 'confirmed') {
                                            navigate(`/?eventId=${state.eventData.id}`);
                                        } else {
                                            dispatch({ type: "SET_MODE", payload: "view" });
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert("Failed to update event.");
                                    } finally {
                                        setLoading(false);
                                    }
                                } else {
                                    handleCreateEvent(data);
                                }
                            }}
                            initialData={state.eventData || {}}
                            isEditing={isEditing}
                        />
                        {isEditing && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (state.eventData.status === 'confirmed') {
                                        navigate(`/?eventId=${state.eventData.id}`);
                                    } else {
                                        dispatch({ type: "SET_MODE", payload: "view" });
                                    }
                                }}
                                className="w-full mt-4"
                            >
                                Back
                            </Button>
                        )}
                    </CardContent>
                </Card>
                {!isEditing && <MyEventsList />}
            </div>
        );
    }

    return null;
}
