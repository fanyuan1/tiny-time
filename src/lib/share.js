export const canNativeShare = () => typeof navigator !== "undefined" && Boolean(navigator.share);

export const nativeShare = async ({ title, text, url }) => {
    try {
        await navigator.share({ title, text, url });
        return true;
    } catch {
        return false;
    }
};

export const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textArea);
        return ok;
    }
};
