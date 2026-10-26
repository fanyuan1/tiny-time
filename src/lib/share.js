export const canNativeShare = () => typeof navigator !== "undefined" && !!navigator.share;

/**
 * Opens the OS share sheet. Returns false if the user cancelled or sharing is unavailable.
 */
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
        // Clipboard API is missing or blocked on some older mobile browsers.
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
