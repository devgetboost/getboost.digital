/**
 * Decodes Gmail MIME message parts to extract HTML or plain text body.
 */
export function getGmailBody(message: any): string {
  if (!message?.payload) return message?.snippet || "";

  const parts = message.payload.parts || [];
  
  // 1. Try to find HTML part
  const htmlPart = findPart(parts, "text/html");
  if (htmlPart?.body?.data) {
    return decodeBase64(htmlPart.body.data);
  }

  // 2. Try to find plain text part
  const plainPart = findPart(parts, "text/plain");
  if (plainPart?.body?.data) {
    const text = decodeBase64(plainPart.body.data);
    return text.replace(/\n/g, "<br/>");
  }

  // 3. Fallback to snippet
  return message.snippet || "";
}

function findPart(parts: any[], mimeType: string): any {
  for (const part of parts) {
    if (part.mimeType === mimeType) return part;
    if (part.parts) {
      const found = findPart(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function decodeBase64(data: string): string {
  try {
    // Gmail uses web-safe base64
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    console.warn("Base64 decode failed", e);
    return "";
  }
}
