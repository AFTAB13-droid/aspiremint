export const GOOGLE_SCRIPT_URL = 
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  process.env.GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzoAD3oDzidFE2vZ_9tB92BV6is8N1m-AgX_BqP21AgUU_SjNaqpUhXjZ_ew0qpDqgePQ/exec";

export const pushToGoogleSheet = async (
  type: "ORDER" | "REFUND",
  data: Record<string, any>
) => {
  try {
    const payload: Record<string, any> = {
      type,
      ...data,
    };

    // If Timestamp is not explicitly supplied in data, add it
    if (!payload.Timestamp && !payload.timestamp) {
      payload.Timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    }

    // We must await this, otherwise Vercel will kill the process before Google receives it
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Google Sheets Webhook Error:", error);
  }
};
