import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 280,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code data URL:", err);
    return "";
  }
}
