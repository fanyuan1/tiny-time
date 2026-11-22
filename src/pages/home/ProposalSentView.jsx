import { useNavigate } from "react-router-dom";
import { useEvent } from "@/context/EventContext";
import { NotifyButton } from "@/components/NotifyButton";
import { canNativeShare, nativeShare } from "@/lib/share";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

function ShareLinkRow({ shareUrl, copied, onCopy }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Share this event</label>
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-2 text-sm text-gray-600 truncate text-left">
                    {shareUrl}
                </div>
                <Button size="sm" variant="outline" onClick={onCopy}>
                    {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
}

export function ProposalSentView({ copied, copyWithFeedback }) {
    const { state } = useEvent();
    const navigate = useNavigate();
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

                <ShareLinkRow shareUrl={shareUrl} copied={copied} onCopy={() => copyWithFeedback(`${proposalText} ${shareUrl}`)} />

                {canNativeShare() && (
                    <Button className="w-full" onClick={() => nativeShare({ title: state.eventData?.title, text: proposalText, url: shareUrl })}>
                        <Share2 className="w-4 h-4 mr-2" /> Share with host
                    </Button>
                )}

                <NotifyButton eventId={state.eventData.id} role="guest" label="Notify me when the host confirms" />

                <Button className="w-full" variant={canNativeShare() ? "outline" : "default"} onClick={() => navigate(`/?eventId=${state.eventData.id}`, { replace: true })}>
                    Back to Event
                </Button>
            </CardContent>
        </Card>
    );
}
