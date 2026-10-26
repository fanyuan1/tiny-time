import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { getMyEvents, removeMyEvent } from "@/lib/myEvents";

// Status is a snapshot from the last time the event was opened on this device.
const STATUS_LABEL = { pending: "Pending", negotiating: "New times proposed", confirmed: "Confirmed" };

export const MyEventsList = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState(getMyEvents);

    if (events.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Your events</CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto space-y-2">
                {events.map((e) => (
                    <div key={e.id} className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(`/?eventId=${e.id}`)}
                            className="flex-1 min-w-0 flex items-center justify-between gap-2 rounded-md border border-gray-200 p-3 text-left hover:bg-blue-50 hover:border-blue-200"
                        >
                            <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">{e.title || "Untitled event"}</div>
                                <div className="text-xs text-gray-500">
                                    {e.role === "host" ? "Hosting" : "Invited"}
                                    {e.start && ` · ${format(new Date(e.start), "EEE, MMM d, h:mm a")}`}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {e.status && <Badge variant="secondary">{STATUS_LABEL[e.status] || e.status}</Badge>}
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </button>
                        <button
                            type="button"
                            aria-label={`Remove ${e.title || "event"} from this list`}
                            onClick={() => {
                                removeMyEvent(e.id);
                                setEvents(getMyEvents());
                            }}
                            className="p-2 text-gray-400 hover:text-gray-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
