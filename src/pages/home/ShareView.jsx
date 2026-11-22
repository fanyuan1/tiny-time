import { useNavigate } from "react-router-dom";
import { useEvent } from "@/context/EventContext";
import { NotifyButton } from "@/components/NotifyButton";
import { canNativeShare, nativeShare } from "@/lib/share";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

export function ShareView({ shareUrl, copied, copyWithFeedback }) {
    const { state } = useEvent();
    const navigate = useNavigate();
    const inviteText = `You're invited to ${state.eventData?.title || 'a playdate'}! View details & RSVP:`;

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
                    <Button size="icon" variant="outline" onClick={() => copyWithFeedback(`${inviteText} ${shareUrl}`)}>
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
