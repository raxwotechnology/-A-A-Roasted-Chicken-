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
      }, 2000);
    }, 100);
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
/**
 * Cache for saved printers to avoid network latency on every print
 */
let cachedPrinters = null;
let lastPrintersFetch = 0;
const PRINTER_CACHE_TTL = 60 * 1000; // 1 minute cache

const getSavedPrinters = async (token) => {
  if (cachedPrinters && (Date.now() - lastPrintersFetch < PRINTER_CACHE_TTL)) {
    return cachedPrinters;
  }
  try {
    const cached = localStorage.getItem("cached_printers");
    if (cached && !cachedPrinters) {
      cachedPrinters = JSON.parse(cached);
    }
  } catch (e) {}

  if (token) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/printers`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 2000 // 2s timeout max
      });
      cachedPrinters = res.data || [];
      lastPrintersFetch = Date.now();
      try {
        localStorage.setItem("cached_printers", JSON.stringify(cachedPrinters));
      } catch (e) {}
      return cachedPrinters;
    } catch (err) {
      console.warn("Failed to load saved printers, using cache:", err.message);
    }
  }
  return cachedPrinters || [];
};

/**
 * Fast QZ Tray connection check with 1.2s timeout so it doesn't hang
 */
const connectQZTrayFast = () => {
  if (typeof qz === "undefined") return Promise.reject(new Error("QZ Tray not installed"));
  if (qz.websocket && qz.websocket.isActive && qz.websocket.isActive()) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("QZ Tray connection timeout (1.2s)"));
    }, 1200);

    qz.websocket.connect({ retries: 0, delay: 0 })
      .then(() => {
        clearTimeout(timeout);
        resolve();
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
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

  const savedPrinters = await getSavedPrinters(token);

  // Attempt QZ Tray print if available & printers are configured
  let printedViaQZ = false;
  if (typeof qz !== "undefined" && savedPrinters.length > 0) {
    try {
      await connectQZTrayFast();

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

        const htmlToPrint = isKitchen ? (kitchenHTML || customerHTML) : (customerHTML || kitchenHTML);
        if (!htmlToPrint) continue;

        try {
          const config = qz.configs.create(printerName, {
            rasterize: true,
            margins: 0,
            scaleContent: true
          });
          await qz.print(config, getPrintData(htmlToPrint));
          printedViaQZ = true;
          toast.success(`✅ Printed to ${printerName}`);
        } catch (err) {
          console.error(`Print failed for ${printerName}:`, err);
        }
      }
    } catch (err) {
      // QZ Tray not running or not responsive — proceed immediately to browser print without delay
      console.info("QZ Tray not active, using fast browser print fallback");
    }
  }

  // If not printed via QZ Tray, immediately trigger browser print
  if (!printedViaQZ) {
    const fallbackHTML = targetRole === "kitchen" ? (kitchenHTML || customerHTML) : customerHTML;
    if (fallbackHTML) {
      printHTMLViaBrowser(fallbackHTML);
    }
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