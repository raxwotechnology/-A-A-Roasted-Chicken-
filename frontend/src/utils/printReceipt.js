// src/utils/printReceipt.js
import { toast } from "react-toastify";
import axios from "axios";
import API_BASE_URL from "../api.js";

/**
 * Prints the given receiptHTML to all printers saved in the backend.
//  * @param {string} receiptHTML - The HTML string to print
 */
export const printReceiptToBoth = async (receiptHTML) => {
  if (!receiptHTML || typeof receiptHTML !== "string") {
    toast.error("❌ Invalid receipt data.");
    return;
  }

  let token;
  try {
    token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");
  } catch (err) {
    toast.error("❌ User not authenticated.");
    return;
  }

  // 1. Fetch saved printers from backend
  let savedPrinters = [];
  try {
    toast.info("📥 Loading saved printers...");
    const res = await axios.get(`${API_BASE_URL}/api/auth/printers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    savedPrinters = res.data;
    if (savedPrinters.length === 0) {
      toast.warn("⚠️ No printers configured. Go to Printer Settings to add one.");
      return;
    }
  } catch (err) {
    console.error("Failed to load printers:", err);
    toast.error("❌ Failed to load saved printers.");
    return;
  }

  // 2. Connect to QZ Tray
  try {
    toast.info("🔌 Connecting to QZ Tray...");
    await qz.websocket.connect();

    const printData = [{
      type: 'pixel',     // ← This is required for HTML
      format: 'html',    // ← Format is "html"
      flavor: 'plain',
      data: receiptHTML
    }];

    const printedSuccessfully = [];
    const failedPrinters = [];

    // 3. Print to each saved printer
    for (const printer of savedPrinters) {
      const printerName = printer.name.trim();
      try {
        const config = qz.configs.create(printerName);
        await qz.print(config, printData);
        printedSuccessfully.push(printerName);
        toast.success(`✅ Printed to: ${printerName}`);
      } catch (err) {
        failedPrinters.push(printerName);
        toast.error(`❌ Failed to print to: ${printerName}`);
        console.error(`Print failed for ${printerName}:`, err);
      }
    }

    // 4. Final summary
    if (printedSuccessfully.length === 0) {
      toast.error("🔥 All print jobs failed! Check printer names and QZ Tray.");
    } else if (failedPrinters.length > 0) {
      toast.warn(`⚠️ Partial success: ${printedSuccessfully.length} of ${savedPrinters.length} printed.`);
    } else {
      toast.success(`🎉 Successfully printed to ${savedPrinters.length} printer(s)!`);
    }

  } catch (err) {
    if (err.message?.includes("QZ")) {
      toast.error("❌ QZ Tray is not running or blocked. Please start QZ Tray and refresh.");
    } else {
      toast.error("❌ Failed to connect to QZ Tray.");
    }
    console.error("QZ Connection Error:", err);
  } finally {
    // Always disconnect
    try {
      await qz.websocket.disconnect();
      toast.info("🔌 Disconnected from QZ Tray.");
    } catch (e) {
      console.warn("QZ disconnect warning:", e);
    }
  }
};