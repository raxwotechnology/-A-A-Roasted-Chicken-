import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { printReceiptToBoth, printCustomerReceipt, printKitchenKOT } from "../utils/printReceipt";
import LogoImage from "../upload/logo.png";
import API_BASE_URL from "../api.js";

const ReceiptModal = ({ order, onClose }) => {
  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "A&A Roasted Chicken",
    address: "337C, Galle Road, Mt. Lavinia",
    phone: "0769 886 887",
    email: "aandafoods2026@gmail.com",
    logo: ""
  });
  const [activeTab, setActiveTab] = useState("bill"); // "bill" | "kot"

  useEffect(() => {
    const fetchRestaurantSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setRestaurantDetails({
            name: res.data.name || "A&A Roasted Chicken",
            address: res.data.address || "337C, Galle Road, Mt. Lavinia",
            phone: res.data.phone || "0769 886 887",
            email: res.data.email || "aandafoods2026@gmail.com",
            logo: res.data.logo || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch restaurant settings in modal:", err);
      }
    };
    fetchRestaurantSettings();
  }, []);

  // Auto-print both Customer Receipt & Kitchen KOT when modal opens
  useEffect(() => {
    if (!order) return;
    const timer = setTimeout(() => {
      try {
        const fullHTML = generatePrintableHTML();
        const kitchenHTML = generateKitchenHTML();
        printReceiptToBoth(fullHTML, kitchenHTML);
      } catch (err) {
        console.error("Auto print error:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [order]);

  if (!order) return null;

  const symbol = localStorage.getItem("currencySymbol") || "Rs.";

  const {
    customerName,
    customerPhone,
    tableNo,
    items = [],
    totalPrice
  } = order;

  const getAbsoluteLogo = (logo) => {
    if (!logo || typeof logo !== "string") return "";
    if (logo.startsWith("data:") || logo.startsWith("http://") || logo.startsWith("https://")) {
      return logo;
    }
    return window.location.origin + (logo.startsWith("/") ? logo : "/" + logo);
  };

  const logoSrc = getAbsoluteLogo(restaurantDetails.logo) || getAbsoluteLogo(LogoImage) || LogoImage;
  const now = new Date().toLocaleString();
  const dailyNo = order.dailyOrderNo || (order.invoiceNo ? order.invoiceNo.split('-').pop() : '1');
  const orderTypeStr = tableNo > 0 ? `Dine In - Table ${tableNo}` : `Takeaway${order.deliveryType ? ` (${order.deliveryType})` : ''}`;

  // 🧾 1. CUSTOMER BILL TEMPLATE (Full with prices, charges, total)
  const generatePrintableHTML = () => {
    const itemsRows = items.map((item, idx) => `
      <tr key="${idx}">
        <td style="padding:4px 0;width:50%;text-align:left;">${item.name}</td>
        <td style="padding:4px 0;width:20%;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 0;width:30%;text-align:right;">${symbol}${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('');

    let serviceChargeRow = '';
    if (order.serviceCharge > 0) {
      const pct = order.subtotal ? ((order.serviceCharge * 100) / order.subtotal).toFixed(2) : '0.00';
      serviceChargeRow = `
        <tr>
          <td style="padding:4px 0;text-align:left;">Service Charge (${pct}%)</td>
          <td></td>
          <td style="padding:4px 0;text-align:right;">${symbol}${order.serviceCharge.toFixed(2)}</td>
        </tr>
      `;
    }

    let deliveryChargeRow = '';
    if (order.deliveryCharge > 0) {
      deliveryChargeRow = `
        <tr>
          <td style="padding:4px 0;text-align:left;">Delivery Charge</td>
          <td></td>
          <td style="padding:4px 0;text-align:right;">${symbol}${order.deliveryCharge.toFixed(2)}</td>
        </tr>
      `;
    }

    let deliveryNoteSection = '';
    if (order.deliveryCharge > 0 && order.deliveryNote) {
      deliveryNoteSection = `<p><strong>Delivery Note:</strong><br>${order.deliveryNote}</p>`;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Customer Receipt</title>
          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
              width: 275px;
              margin: 0;
              padding: 7.5px;
              background: #fff;
              color: #000;
              line-height: 1.4;
              box-sizing: border-box;
            }
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0 16px;
            }
            th, td {
              padding: 4px 0;
            }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            .mb-1 { margin-bottom: 4px; }
            h3, h4, h5 { margin: 6px 0; }
            p { margin: 4px 0; }
          </style>
        </head>
        <body>
        <div class="text-center mb-2">
          ${logoSrc ? `<img src="${logoSrc}" alt="Logo" style="max-width:180px; max-height:80px; width:auto; height:auto; object-fit:contain; display:inline-block;" />` : ''}
        </div>
        
        <h3 class="text-center" style="font-size:20px; font-weight:bold; margin:6px 0;">${restaurantDetails.name}</h3>
        <p class="text-center" style="font-size:12px; margin:4px 0;">${restaurantDetails.address}</p>
        <p class="text-center" style="font-size:14px; font-weight:bold; margin:4px 0;">${restaurantDetails.phone}</p>
        ${restaurantDetails.email ? `<p class="text-center" style="font-size:12px; margin:2px 0 10px 0;">${restaurantDetails.email}</p>` : ''}
        
        <hr />

        <div class="text-center" style="font-size:18px; font-weight:bold; margin:6px 0; border:1px dashed #000; padding:4px 0;">
          DAILY TOKEN #: #${dailyNo}
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:14px; margin:8px 0;">
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Invoice No:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.invoiceNo || 'N/A'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Date:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${now}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Customer:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.customerName || 'Walk-in'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Phone:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.customerPhone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Order Type:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top; white-space:nowrap;">${orderTypeStr}</td>
          </tr>
          ${order.tableNo === "Takeaway" && order.deliveryType === "Delivery Service" ? `
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Delivery Place:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.deliveryPlaceName || 'N/A'}</td>
          </tr>` : ''}
        </table>

        <hr />

        <table style="width:100%; border-collapse:collapse; font-size:14px; margin:8px 0 16px 0;">
          <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid #000; padding:4px 0;">Items</th>
              <th style="text-align:center; border-bottom:1px solid #000; padding:4px 0;">Qty</th>
              <th style="text-align:right; border-bottom:1px solid #000; padding:4px 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            ${serviceChargeRow}
            ${deliveryChargeRow}
          </tbody>
        </table>

        <hr />

        <table style="width:100%; border-collapse:collapse; font-size:15px; margin-top:4px;">
          <tr>
            <td style="text-align:left; font-weight:bold; padding:4px 0;">Total:</td>
            <td style="text-align:right; font-weight:bold; padding:4px 0;">${symbol}${(order.totalPrice || 0).toFixed(2)}</td>
          </tr>
        </table>

        <hr />
        <p class="text-center" style="font-size:15px; font-weight:bold; margin:8px 0 4px 0;">Thank you for your order!</p>
        <p class="text-center" style="font-size:12px; margin:2px 0; color:#555;">Software By: Raxwo (Pvt) Ltd.</p>
        <p class="text-center" style="font-size:12px; margin:2px 0; color:#555;">Contact: 074 357 3333</p>
        <hr />

        ${deliveryNoteSection}
        </body>
      </html>
    `;
  };

  // 🍳 2. KITCHEN ORDER TICKET (KOT) TEMPLATE (Items & Qty & Order No ONLY - NO PRICES)
  const generateKitchenHTML = () => {
    const kotItemRows = items.map((item) => `
      <tr style="border-bottom: 1px dashed #666;">
        <td style="padding:6px 2px; width:25%; text-align:center; font-size:20px; font-weight:900; vertical-align:middle;">
          ${item.quantity} x
        </td>
        <td style="padding:6px 4px; width:75%; text-align:left; font-size:16px; font-weight:bold; vertical-align:middle;">
          ${item.name}
          ${item.specialNotes ? `<div style="font-size:12px; font-weight:normal; color:#444;">Note: ${item.specialNotes}</div>` : ''}
        </td>
      </tr>
    `).join('');

    const deliveryNoteSection = order.deliveryNote ? `
      <div style="margin-top:8px; border-top:1px dashed #000; padding-top:4px; font-size:13px;">
        <strong>Delivery Note:</strong> ${order.deliveryNote}
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Kitchen Order Ticket</title>
          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
              width: 275px;
              margin: 0;
              padding: 6px;
              background: #fff;
              color: #000;
              line-height: 1.3;
              box-sizing: border-box;
            }
            hr {
              border: 0;
              border-top: 2px dashed #000;
              margin: 6px 0;
            }
            .text-center { text-align: center; }
            .token-box {
              text-align: center;
              font-size: 24px;
              font-weight: 900;
              margin: 6px 0;
              border: 2px solid #000;
              padding: 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
          </style>
        </head>
        <body>
          <div class="text-center" style="font-size:15px; font-weight:bold; letter-spacing:1px;">*** KITCHEN ORDER (KOT) ***</div>
          
          <div class="token-box">
            TOKEN #: #${dailyNo}
          </div>

          <table style="font-size:13px; margin:4px 0;">
            <tr>
              <td style="font-weight:bold; width:80px;">Invoice:</td>
              <td>${order.invoiceNo || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Type:</td>
              <td style="font-weight:bold; font-size:14px;">${orderTypeStr}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Time:</td>
              <td>${now}</td>
            </tr>
          </table>

          <hr />

          <table>
            <thead>
              <tr style="border-bottom: 2px solid #000;">
                <th style="text-align:center; padding:4px 0; width:25%; font-size:14px;">QTY</th>
                <th style="text-align:left; padding:4px 0; width:75%; font-size:14px;">ITEM NAME</th>
              </tr>
            </thead>
            <tbody>
              ${kotItemRows}
            </tbody>
          </table>

          <hr />
          ${deliveryNoteSection}
          <div class="text-center" style="font-weight:bold; font-size:13px; margin-top:8px;">*** END OF KOT ***</div>
        </body>
      </html>
    `;
  };

  const exportToPDF = () => {
    const input = document.getElementById("receipt-content");
    if (!input) {
      alert("Receipt not found");
      return;
    }

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`${activeTab === "kot" ? "kitchen_kot" : "customer_bill"}_#${dailyNo}.pdf`);
    });
  };

  return (
    <div
      className="receipt-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.6)",
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "24px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {/* Control Buttons Bar */}
      <div className="text-center mb-3 d-print-none bg-white p-3 rounded shadow-sm" style={{ maxWidth: "520px", width: "100%" }}>
        {/* Tab Switcher */}
        <div className="btn-group w-100 mb-3" role="group">
          <button
            type="button"
            className={`btn fw-bold ${activeTab === "bill" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTab("bill")}
          >
            🧾 Customer Bill (Full)
          </button>
          <button
            type="button"
            className={`btn fw-bold ${activeTab === "kot" ? "btn-warning" : "btn-outline-warning text-dark"}`}
            onClick={() => setActiveTab("kot")}
          >
            🍳 Kitchen KOT (Items & Qty Only)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <button onClick={onClose} className="btn btn-secondary btn-sm px-3">
            ❌ Close
          </button>
          <button onClick={exportToPDF} className="btn btn-outline-dark btn-sm px-3">
            📄 PDF
          </button>
          <button
            className="btn btn-success btn-sm px-3 fw-bold"
            onClick={() => {
              const fullHTML = generatePrintableHTML();
              printCustomerReceipt(fullHTML);
            }}
          >
            🖨️ Print Customer Bill
          </button>
          <button
            className="btn btn-warning btn-sm px-3 fw-bold text-dark"
            onClick={() => {
              const kitchenHTML = generateKitchenHTML();
              printKitchenKOT(kitchenHTML);
            }}
          >
            🍳 Print Kitchen KOT
          </button>
          <button
            className="btn btn-primary btn-sm px-3 fw-bold"
            onClick={() => {
              const fullHTML = generatePrintableHTML();
              const kitchenHTML = generateKitchenHTML();
              printReceiptToBoth(fullHTML, kitchenHTML);
            }}
          >
            📑 Print Both
          </button>
        </div>
      </div>

      {/* Dynamic Receipt Content */}
      <div
        id="receipt-content"
        style={{
          maxWidth: "295px",
          width: "100%",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          lineHeight: 1.4,
          fontFamily: "Calibri, sans-serif",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}
      >
        {activeTab === "bill" ? (
          /* =================== CUSTOMER BILL VIEW =================== */
          <>
            <div className="text-center mb-2">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{
                    maxWidth: '180px',
                    maxHeight: '80px',
                    width: 'auto',
                    height: 'auto',
                    display: 'inline-block',
                    objectFit: 'contain'
                  }}
                />
              ) : null}
            </div>
            <h3 className="mb-1 fs-5 text-center"><strong>{restaurantDetails.name}</strong></h3>
            <p className="mb-0 text-center" style={{ fontSize: "13px" }}>{restaurantDetails.address}</p>
            <p className="mb-0 text-center" style={{ fontSize: "14px" }}><strong>{restaurantDetails.phone}</strong></p>
            {restaurantDetails.email && (
              <p className="mb-2 text-center" style={{ fontSize: "12px", color: "#666" }}>{restaurantDetails.email}</p>
            )}
            <hr style={{ margin: "8px 0" }}/>

            <div className="text-center fw-bold py-1 mb-2" style={{ fontSize: "17px", border: "1px dashed #000" }}>
              DAILY TOKEN #: #{dailyNo}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: "6px 0" }}>
              <tbody>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Invoice No:</td>
                  <td style={{ padding: "2px 0" }}>{order.invoiceNo || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Date:</td>
                  <td style={{ padding: "2px 0" }}>{now}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Customer:</td>
                  <td style={{ padding: "2px 0" }}>{customerName || 'Walk-in'}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Phone:</td>
                  <td style={{ padding: "2px 0" }}>{customerPhone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Order Type:</td>
                  <td style={{ padding: "2px 0", whiteSpace: "nowrap" }}>{orderTypeStr}</td>
                </tr>
                {tableNo === "Takeaway" && order.deliveryType === "Delivery Service" && (
                  <tr>
                    <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Delivery Place:</td>
                    <td style={{ padding: "2px 0" }}>{order.deliveryPlaceName || 'N/A'}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr style={{ margin: "8px 0" }}/>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <th style={{ padding: "4px 0", width: "50%", textAlign: "left" }}>Items</th>
                  <th style={{ padding: "4px 0", width: "20%", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "4px 0", width: "30%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "4px 0", width: "50%", textAlign: "left" }}>{item.name}</td>
                    <td style={{ padding: "4px 0", width: "20%", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "4px 0", width: "30%", textAlign: "right" }}>
                      {symbol}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {order.serviceCharge > 0 && (
                  <tr>
                    <td style={{ padding: "4px 0", textAlign: "left" }}>
                      Service Charge ({((order.serviceCharge * 100) / (order.subtotal || 1)).toFixed(2)}%)
                    </td>
                    <td></td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      {symbol}{order.serviceCharge?.toFixed(2)}
                    </td>
                  </tr>
                )}

                {order.deliveryCharge > 0 && (
                  <tr>
                    <td style={{ padding: "4px 0", textAlign: "left" }}>Delivery Charge</td>
                    <td></td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      {symbol}{order.deliveryCharge?.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr style={{ margin: "8px 0" }}/>
            <h5 className="text-end fs-6 mb-2"><strong>Total: {symbol}{totalPrice?.toFixed(2)}</strong></h5>

            <p className="text-center mb-1 fw-bold" style={{ fontSize: "15px" }}>Thank you for your order!</p>
            <p className="text-center mb-0" style={{ fontSize: "12px", color: "#555" }}>Software By: Raxwo (Pvt) Ltd.</p>
            <p className="text-center mb-1" style={{ fontSize: "12px", color: "#555" }}>Contact: 074 357 3333</p>
            <hr style={{ margin: "8px 0" }}/>

            {order.deliveryCharge > 0 && order.deliveryNote?.trim() && (
              <div style={{ fontSize: "13px" }}>
                <strong>Delivery Note:</strong>
                <div>{order.deliveryNote}</div>
              </div>
            )}
          </>
        ) : (
          /* =================== KITCHEN KOT VIEW =================== */
          <>
            <div className="text-center fw-bold mb-1" style={{ fontSize: "15px", letterSpacing: "1px" }}>
              *** KITCHEN ORDER (KOT) ***
            </div>

            <div className="text-center fw-bold py-2 my-2" style={{ fontSize: "24px", border: "2px solid #000" }}>
              TOKEN #: #{dailyNo}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: "6px 0" }}>
              <tbody>
                <tr>
                  <td style={{ width: "80px", fontWeight: "bold", padding: "2px 0" }}>Invoice:</td>
                  <td style={{ padding: "2px 0" }}>{order.invoiceNo || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", fontWeight: "bold", padding: "2px 0" }}>Type:</td>
                  <td style={{ padding: "2px 0", fontWeight: "bold", fontSize: "14px" }}>{orderTypeStr}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", fontWeight: "bold", padding: "2px 0" }}>Time:</td>
                  <td style={{ padding: "2px 0" }}>{now}</td>
                </tr>
              </tbody>
            </table>

            <hr style={{ margin: "8px 0", borderTop: "2px dashed #000" }}/>

            <table style={{ width: "100%", borderCollapse: "collapse", margin: "6px 0" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  <th style={{ padding: "4px 0", width: "25%", textAlign: "center", fontSize: "14px" }}>QTY</th>
                  <th style={{ padding: "4px 0", width: "75%", textAlign: "left", fontSize: "14px" }}>ITEM NAME</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px dashed #666" }}>
                    <td style={{ padding: "6px 2px", width: "25%", textAlign: "center", fontSize: "19px", fontWeight: "900", verticalAlign: "middle" }}>
                      {item.quantity} x
                    </td>
                    <td style={{ padding: "6px 4px", width: "75%", textAlign: "left", fontSize: "15px", fontWeight: "bold", verticalAlign: "middle" }}>
                      {item.name}
                      {item.specialNotes && (
                        <div style={{ fontSize: "12px", fontWeight: "normal", color: "#555" }}>
                          Note: {item.specialNotes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr style={{ margin: "8px 0", borderTop: "2px dashed #000" }}/>

            {order.deliveryNote?.trim() && (
              <div style={{ fontSize: "13px", marginTop: "6px" }}>
                <strong>Delivery Note:</strong> {order.deliveryNote}
              </div>
            )}

            <div className="text-center fw-bold mt-2" style={{ fontSize: "13px" }}>
              *** END OF KOT ***
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;
