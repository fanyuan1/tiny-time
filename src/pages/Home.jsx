import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEvent } from "@/context/EventContext";
import { copyText } from "@/lib/share";
import { Loader2 } from "lucide-react";
import Confirmation from "./Confirmation";
import { useEventLoader } from "./home/useEventLoader";
import { PickTimeView } from "./home/PickTimeView";
import { ShareView } from "./home/ShareView";
import { EventView } from "./home/EventView";
import { ConfirmBookingView } from "./home/ConfirmBookingView";
import { ProposeTimeView } from "./home/ProposeTimeView";
import { ProposalSentView } from "./home/ProposalSentView";
import { CreateEditView } from "./home/CreateEditView";

const useCopyFeedback = () => {
    const [copied, setCopied] = useState(false);
    const copyWithFeedback = async (text) => {
        if (await copyText(text)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return { copied, copyWithFeedback };
};

function ModeView({ mode, ...shared }) {
    const { state } = useEvent();
    switch (mode) {
        case "confirmed_view":
            return <Confirmation eventData={state.eventData} />;
        case "pick_time":
            return <PickTimeView setLoading={shared.setLoading} setShareUrl={shared.setShareUrl} />;
        case "share":
            return <ShareView shareUrl={shared.shareUrl} copied={shared.copied} copyWithFeedback={shared.copyWithFeedback} />;
        case "view":
            return <EventView />;
        case "confirm_booking":
            return <ConfirmBookingView setLoading={shared.setLoading} />;
        case "propose_time":
            return <ProposeTimeView proposalSlots={shared.proposalSlots} setProposalSlots={shared.setProposalSlots} setLoading={shared.setLoading} />;
        case "proposal_sent":
            return <ProposalSentView copied={shared.copied} copyWithFeedback={shared.copyWithFeedback} />;
        case "create":
        case "edit_event":
            return <CreateEditView prefillKey={shared.prefillKey} setLoading={shared.setLoading} />;
        default:
            return null;
    }
}

export default function Home() {
    const [searchParams] = useSearchParams();
    const { state } = useEvent();
    const [loading, setLoading] = useState(Boolean(searchParams.get("eventId")));
    const [shareUrl, setShareUrl] = useState("");
    const [proposalSlots, setProposalSlots] = useState([]);
    const [prefillKey, setPrefillKey] = useState(0);
    const { copied, copyWithFeedback } = useCopyFeedback();
    useEventLoader({ setLoading, setPrefillKey });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <ModeView
            mode={state.mode}
            setLoading={setLoading}
            shareUrl={shareUrl}
            setShareUrl={setShareUrl}
            copied={copied}
            copyWithFeedback={copyWithFeedback}
            proposalSlots={proposalSlots}
            setProposalSlots={setProposalSlots}
            prefillKey={prefillKey}
        />
    );
}
