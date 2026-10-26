import { useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";
import { pushSupported, enablePush } from "@/lib/push";

export const NotifyButton = ({ eventId, role, label }) => {
    const [status, setStatus] = useState("idle"); // idle, loading, on, error
    const [error, setError] = useState("");

    if (!pushSupported()) return null;

    const handleClick = async () => {
        setStatus("loading");
        try {
            await enablePush(eventId, role);
            setStatus("on");
        } catch (e) {
            console.error("Failed to enable push", e);
            setError(Notification.permission === "denied"
                ? "Notifications are blocked. Allow them in your browser settings."
                : "Couldn't turn on notifications. Please try again.");
            setStatus("error");
        }
    };

    return (
        <div className="space-y-1">
            <Button variant="outline" className="w-full" disabled={status === "loading" || status === "on"} onClick={handleClick}>
                {status === "loading" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {status === "on" ? <BellRing className="w-4 h-4 mr-2" /> : status !== "loading" && <Bell className="w-4 h-4 mr-2" />}
                {status === "on" ? "Notifications on" : label}
            </Button>
            {status === "error" && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
};
