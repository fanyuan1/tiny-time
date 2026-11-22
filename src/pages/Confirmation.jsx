import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getEvent } from "@/lib/db";
import { downloadICS } from "@/lib/ics";
import { canNativeShare, nativeShare, copyText } from "@/lib/share";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle, Calendar, MapPin, Clock, Pencil, Share2, Check, FileText, CalendarPlus } from "lucide-react";
import { format, addMinutes } from "date-fns";

const resolveTimes = (event) => {
    try {
        let startTime = new Date(event.confirmedSlot.start);
        if (isNaN(startTime.getTime())) {
            console.error("Invalid start time:", event.confirmedSlot.start);
            startTime = new Date();
        }
        return { startTime, endTime: addMinutes(startTime, event.duration || 30) };
    } catch (e) {
        console.error("Error parsing dates:", e);
        const startTime = new Date();
        return { startTime, endTime: addMinutes(startTime, 30) };
    }
};

const calendarUrls = (event, startTime, endTime) => {
    const startISO = startTime.toISOString().replace(/-|:|\.\d+/g, "");
    const endISO = endTime.toISOString().replace(/-|:|\.\d+/g, "");
    const attendees = [event.hostEmail, event.guestEmail].filter(Boolean).join(',');
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');
    const title = encodeURIComponent(event.title);
    const to = encodeURIComponent(attendees);
    return {
        google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&details=${description}&location=${location}&add=${to}`,
        outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${description}&location=${location}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&to=${to}`,
    };
};

const useConfirmedEvent = (eventData, eventId) => {
    const [event, setEvent] = useState(eventData || null);
    useEffect(() => {
        if (eventData) {
            setEvent(eventData);
        } else if (eventId) {
            getEvent(eventId).then(setEvent);
        }
    }, [eventId, eventData]);
    return event;
};

const useShareConfirmation = (event, eventId) => {
    const [copied, setCopied] = useState(false);
    const share = async () => {
        const eventLink = `${window.location.origin}/?eventId=${eventId}`;
        const text = `${event?.title || 'Your playdate'} has been confirmed! View details & add to your calendar:`;
        if (canNativeShare()) {
            await nativeShare({ title: event?.title, text, url: eventLink });
        } else if (await copyText(`${text} ${eventLink}`)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return { copied, share };
};

function IconAction({ onClick, title, children }) {
    return (
        <Button variant="ghost" size="sm" onClick={onClick} className="text-gray-500 hover:text-gray-700" title={title}>
            {children}
        </Button>
    );
}

function InfoLine({ Icon, children, align = "items-center", iconClass = "" }) {
    return (
        <p className={`text-gray-600 text-sm flex ${align} gap-2`}>
            <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
            {children}
        </p>
    );
}

function EventSummary({ event, startTime, endTime, copied, onShare, onEdit }) {
    return (
        <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="absolute top-2 right-2 flex gap-1">
                <IconAction onClick={onShare} title="Share event">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                </IconAction>
                <IconAction onClick={onEdit} title="Edit event details">
                    <Pencil className="w-4 h-4" />
                </IconAction>
            </div>
            <div className="space-y-2 text-left">
                <h3 className="font-semibold">{event.title}</h3>
                <InfoLine Icon={Calendar}>{format(startTime, "EEEE, MMMM do, yyyy")}</InfoLine>
                <InfoLine Icon={Clock}>{format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</InfoLine>
                <InfoLine Icon={MapPin}>{event.location}</InfoLine>
                {event.description && (
                    <InfoLine Icon={FileText} align="items-start" iconClass="mt-0.5">{event.description}</InfoLine>
                )}
            </div>
        </div>
    );
}

function CalendarLink({ href, children }) {
    return (
        <Button variant="outline" asChild className="w-full">
            <a href={href} target="_blank" rel="noopener noreferrer">
                <Calendar className="w-4 h-4 mr-2" />
                {children}
            </a>
        </Button>
    );
}

function CalendarDownload({ onClick, children }) {
    return (
        <Button variant="outline" onClick={onClick} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            {children}
        </Button>
    );
}

export default function Confirmation({ eventData }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const eventId = searchParams.get("eventId");
    const event = useConfirmedEvent(eventData, eventId);
    const { copied, share } = useShareConfirmation(event, eventId);

    if (!event || !event.confirmedSlot) {
        return <div className="text-center p-8">Loading confirmation...</div>;
    }

    const { startTime, endTime } = resolveTimes(event);
    const urls = calendarUrls(event, startTime, endTime);
    const downloadIcs = () => downloadICS(event);

    return (
        <div className="w-full">
            <Card className="w-full max-w-3xl mx-auto text-center">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-green-700">Playdate Confirmed!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <EventSummary
                        event={event}
                        startTime={startTime}
                        endTime={endTime}
                        copied={copied}
                        onShare={share}
                        onEdit={() => navigate(`/?eventId=${eventId}&mode=edit`)}
                    />

                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-gray-500 mb-1">Add to your calendar:</p>
                        <CalendarLink href={urls.google}>Google Calendar</CalendarLink>
                        <CalendarDownload onClick={downloadIcs}>iCal</CalendarDownload>
                        <CalendarLink href={urls.outlook}>Outlook</CalendarLink>
                        <CalendarDownload onClick={downloadIcs}>Download ICS</CalendarDownload>
                    </div>

                    <Button variant="outline" onClick={() => navigate('/')} className="w-full bg-gray-50 hover:bg-gray-100">
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Create another Event
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
