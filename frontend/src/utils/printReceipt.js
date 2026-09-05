// src/utils/printReceipt.js
import { toast } from "react-toastify";
import axios from "axios";
import API_BASE_URL from "../api.js";

/**
 * Helper to get QZ Tray print data for an HTML string
 */
const getPrintData = (html) => [{
  type: 'pixel',     // Required for HTML
  format: 'html',    // Format is "html"
  flavor: 'plain',
  data: html
}];

/**
 * Print HTML directly using a temporary hidden iframe for clean browser printing
 */
export const printHTMLViaBrowser = (html) => {
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Iframe print error:", e);
        window.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 400);
  } catch (err) {
    console.warn("Browser iframe print failed, falling back to window.print:", err);
    window.print();
  }
};

/**
 * Prints Customer Receipt and/or Kitchen KOT to appropriate saved printers.
 * @param {string} customerHTML - Full receipt HTML for cashier / customer
 * @param {string} kitchenHTML - KOT HTML with Token #, items & quantities only (NO prices)
 * @param {string} targetRole - "all" | "cashier" | "kitchen"
 */
export const printReceiptToBoth = async (customerHTML, kitchenHTML, targetRole = "all") => {
  let token;
  try {
    token = localStorage.getItem("token");
  } catch (err) {}

  let savedPrinters = [];
  if (token) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/printers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      savedPrinters = res.data || [];
    } catch (err) {
      console.warn("Failed to load saved printers:", err);
    }
  }

  // Connect to QZ Tray if available
  if (typeof qz !== "undefined" && savedPrinters.length > 0) {
    try {
      toast.info("🔌 Connecting to QZ Tray...");
      await qz.websocket.connect();

      const printedSuccessfully = [];
      const failedPrinters = [];

      for (const printer of savedPrinters) {
        const printerName = printer.name ? printer.name.trim() : "";
        if (!printerName) continue;

        const role = (printer.role || "").toLowerCase();
        const isKitchen = role === "kitchen" || 
          printerName.toLowerCase().includes("kitchen") || 
          printerName.toLowerCase().includes("kot") ||
          printerName.toLowerCase().includes("xp-90");

        if (targetRole === "cashier" && isKitchen) continue;
        if (targetRole === "kitchen" && !isKitchen) continue;

        // Kitchen printer receives kitchenHTML (KOT with items & qty only)
        // Cashier printer receives customerHTML (Full Bill with prices & totals)
        const htmlToPrint = isKitchen ? (kitchenHTML || customerHTML) : (customerHTML || kitchenHTML);
        if (!htmlToPrint) continue;

        try {
          const config = qz.configs.create(printerName, {
            rasterize: true,
            margins: 0,
            scaleContent: true
          });
          await qz.print(config, getPrintData(htmlToPrint));
          printedSuccessfully.push({ name: printerName, type: isKitchen ? "Kitchen (KOT)" : "Customer Bill" });
          toast.success(`✅ Printed ${isKitchen ? "Kitchen KOT" : "Customer Bill"} to: ${printerName}`);
        } catch (err) {
          failedPrinters.push(printerName);
          toast.error(`❌ Failed to print to: ${printerName}`);
          console.error(`Print failed for ${printerName}:`, err);
        }
      }

      if (printedSuccessfully.length > 0) {
        return;
      }
    } catch (err) {
      console.warn("QZ Tray error, falling back to browser print:", err);
    } finally {
      try {
        await qz.websocket.disconnect();
      } catch (e) {}
    }
  }

  // Fallback to browser print
  const fallbackHTML = targetRole === "kitchen" ? (kitchenHTML || customerHTML) : customerHTML;
  if (fallbackHTML) {
    toast.info("🖨️ Opening browser print dialog...");
    printHTMLViaBrowser(fallbackHTML);
  }
};

/**
 * Shortcut to print ONLY Customer Receipt
 */
export const printCustomerReceipt = async (customerHTML) => {
  return printReceiptToBoth(customerHTML, null, "cashier");
};

/**
 * Shortcut to print ONLY Kitchen KOT
 */
export const printKitchenKOT = async (kitchenHTML) => {
  return printReceiptToBoth(null, kitchenHTML, "kitchen");
};