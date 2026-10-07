import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentModal = ({ totalAmount, onConfirm, onClose, loading = false }) => {
  const parsedTotal = parseFloat(totalAmount) || 0;
  
  // Payment Mode: 'cash' | 'card' | 'bank' | 'split'
  const [paymentMode, setPaymentMode] = useState("cash");
  
  const [cash, setCash] = useState(parsedTotal);
  const [card, setCard] = useState(0);
  const [cardLast4, setCardLast4] = useState("");
  const [bankTransfer, setBankTransfer] = useState(0);
  const [notes, setNotes] = useState("");
  const [numberPadTarget, setNumberPadTarget] = useState("cash");
  const [showNumberPad, setShowNumberPad] = useState(false);

  // Compute total paid & balance
  const cashNum = parseFloat(cash) || 0;
  const cardNum = parseFloat(card) || 0;
  const bankNum = parseFloat(bankTransfer) || 0;
  const totalPaid = Math.round((cashNum + cardNum + bankNum) * 100) / 100;
  
  const remainingNeeded = Math.max(0, Math.round((parsedTotal - totalPaid) * 100) / 100);
  const changeDue = Math.max(0, Math.round((totalPaid - parsedTotal) * 100) / 100).toFixed(2);

  // Switch payment modes
  const handleModeChange = (mode) => {
    setPaymentMode(mode);
    if (mode === "cash") {
      setCash(parsedTotal);
      setCard(0);
      setCardLast4("");
      setBankTransfer(0);
      setNumberPadTarget("cash");
    } else if (mode === "card") {
      setCash(0);
      setCard(parsedTotal);
      setBankTransfer(0);
      setNumberPadTarget("cardLast4");
    } else if (mode === "bank") {
      setCash(0);
      setCard(0);
      setCardLast4("");
      setBankTransfer(parsedTotal);
      setNumberPadTarget("bankTransfer");
    } else if (mode === "split") {
      // Keep existing amounts or if all 0/cash full, keep ready for split
      setNumberPadTarget("cash");
    }
  };

  // Quick 50/50 Split (Cash + Card)
  const handleSplit5050 = () => {
    const half = Math.round((parsedTotal / 2) * 100) / 100;
    const otherHalf = Math.round((parsedTotal - half) * 100) / 100;
    setPaymentMode("split");
    setCash(half);
    setCard(otherHalf);
    setBankTransfer(0);
    toast.info(`Split 50/50 applied: Cash ${half.toFixed(2)} & Card ${otherHalf.toFixed(2)}`);
  };

  // Quick Fill Remaining for a specific method
  const handleFillRemaining = (field) => {
    const currentWithoutField =
      field === "cash" ? (cardNum + bankNum) :
      field === "card" ? (cashNum + bankNum) :
      (cashNum + cardNum);
    const needed = Math.max(0, Math.round((parsedTotal - currentWithoutField) * 100) / 100);

    if (field === "cash") setCash(needed);
    else if (field === "card") setCard(needed);
    else if (field === "bankTransfer") setBankTransfer(needed);
  };

  // Reset all amounts
  const handleResetAmounts = () => {
    setCash(0);
    setCard(0);
    setBankTransfer(0);
    setCardLast4("");
  };

  const handleSubmit = () => {
    if (totalPaid < parsedTotal) {
      toast.warn(`Please pay the full amount. Still remaining: ${remainingNeeded.toFixed(2)}`);
      return;
    }
    onConfirm({
      cash: cashNum,
      card: cardNum,
      cardLast4: cardNum > 0 ? cardLast4.trim().slice(-4) : "",
      bankTransfer: bankNum,
      totalPaid,
      changeDue,
      notes
    });
  };

  // Handle keyboard typing
  const handleInputChange = (field, value) => {
    if (field === 'cardLast4') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setCardLast4(digits);
      return;
    }

    if (value === '' || /^(\d*\.?\d*)$/.test(value)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (field === 'cash') setCash(numValue || 0);
      else if (field === 'card') setCard(numValue || 0);
      else setBankTransfer(numValue || 0);
    }
  };

  // Number pad handlers
  const handleNumberPadInput = (value) => {
    if (!numberPadTarget) return;

    if (numberPadTarget === 'cardLast4') {
      if (value === '.') return;
      setCardLast4(prev => (prev + value).slice(0, 4));
      return;
    }

    const current = String(
      numberPadTarget === 'cash' ? (cash || 0) :
      numberPadTarget === 'card' ? (card || 0) : (bankTransfer || 0)
    ).replace(/^0+/, '') || '0';

    let newValue;
    if (value === '.') {
      if (!current.includes('.')) newValue = current + '.';
      else return;
    } else {
      if (current === '0' && !current.includes('.')) {
        newValue = value;
      } else {
        newValue = current + value;
      }
    }

    const numValue = parseFloat(newValue) || 0;
    if (numberPadTarget === 'cash') setCash(numValue);
    else if (numberPadTarget === 'card') setCard(numValue);
    else setBankTransfer(numValue);
  };

  const handleClear = () => {
    if (!numberPadTarget) return;
    if (numberPadTarget === 'cardLast4') setCardLast4("");
    else if (numberPadTarget === 'cash') setCash(0);
    else if (numberPadTarget === 'card') setCard(0);
    else setBankTransfer(0);
  };

  const handleBackspace = () => {
    if (!numberPadTarget) return;

    if (numberPadTarget === 'cardLast4') {
      setCardLast4(prev => prev.slice(0, -1));
      return;
    }

    const current = String(
      numberPadTarget === 'cash' ? (cash || 0) :
      numberPadTarget === 'card' ? (card || 0) : (bankTransfer || 0)
    );

    if (current.length <= 1 || (current === '0.')) {
      if (numberPadTarget === 'cash') setCash(0);
      else if (numberPadTarget === 'card') setCard(0);
      else setBankTransfer(0);
    } else {
      const newValue = current.slice(0, -1);
      const numValue = parseFloat(newValue) || 0;
      if (numberPadTarget === 'cash') setCash(numValue);
      else if (numberPadTarget === 'card') setCard(numValue);
      else setBankTransfer(numValue);
    }
  };

  const handleDecimal = () => {
    if (!numberPadTarget) return;
    const current = String(
      numberPadTarget === 'cash' ? (cash || 0) :
      numberPadTarget === 'card' ? (card || 0) : (bankTransfer || 0)
    );
    if (!current.includes('.')) {
      handleNumberPadInput('.');
    }
  };

  const focusField = (field) => {
    setNumberPadTarget(field);
    setShowNumberPad(true);
  };

  const symbol = localStorage.getItem("currencySymbol") || "$";

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3">
            <h5 className="modal-title fw-bold">
              💰 Record Payment
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body p-4">
            {/* Top Totals & Balance Bar */}
            <div className="row g-3 mb-3 align-items-center">
              <div className="col-md-4">
                <div className="p-3 bg-light border rounded text-center">
                  <small className="text-muted fw-semibold text-uppercase d-block">Order Total</small>
                  <span className="fs-3 fw-bold text-dark">{symbol}{parsedTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light border rounded text-center">
                  <small className="text-muted fw-semibold text-uppercase d-block">Total Paid</small>
                  <span className={`fs-3 fw-bold ${totalPaid >= parsedTotal ? "text-success" : "text-primary"}`}>
                    {symbol}{totalPaid.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="col-md-4">
                {remainingNeeded > 0 ? (
                  <div className="p-3 bg-danger bg-opacity-10 border border-danger rounded text-center">
                    <small className="text-danger fw-semibold text-uppercase d-block">⚠️ Still Remaining</small>
                    <span className="fs-3 fw-bold text-danger">{symbol}{remainingNeeded.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="p-3 bg-success bg-opacity-10 border border-success rounded text-center">
                    <small className="text-success fw-semibold text-uppercase d-block">💵 Change Due</small>
                    <span className="fs-3 fw-bold text-success">{symbol}{changeDue}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Mode Selector Tabs */}
            <div className="mb-4">
              <label className="form-label fw-bold text-muted small text-uppercase mb-2">Select Payment Method</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn py-2 px-3 fw-semibold ${paymentMode === "cash" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                  onClick={() => handleModeChange("cash")}
                >
                  💵 Cash Only
                </button>
                <button
                  type="button"
                  className={`btn py-2 px-3 fw-semibold ${paymentMode === "card" ? "btn-primary shadow-sm" : "btn-outline-secondary"}`}
                  onClick={() => handleModeChange("card")}
                >
                  💳 Card Only
                </button>
                <button
                  type="button"
                  className={`btn py-2 px-3 fw-semibold ${paymentMode === "bank" ? "btn-info text-dark shadow-sm" : "btn-outline-secondary"}`}
                  onClick={() => handleModeChange("bank")}
                >
                  🏦 Bank Transfer
                </button>
                <button
                  type="button"
                  className={`btn py-2 px-3 fw-bold ${paymentMode === "split" ? "btn-warning text-dark shadow-sm" : "btn-outline-warning text-dark"}`}
                  onClick={() => handleModeChange("split")}
                >
                  🔀 Split / Multiple Methods
                </button>
              </div>
            </div>

            <div className="row g-4">
              {/* Left Column: Payment Inputs & Quick Controls */}
              <div className="col-md-7">
                {/* Split Helpers Bar (visible in split mode) */}
                {paymentMode === "split" && (
                  <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="text-dark">⚡ Split Payment Helpers:</strong>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={handleSplit5050}
                          title="Split total 50% cash and 50% card"
                        >
                          ⚖️ 50/50 Cash & Card
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={handleResetAmounts}
                          title="Reset all payment amounts to 0"
                        >
                          🧹 Clear All
                        </button>
                      </div>
                    </div>
                    <small className="text-muted d-block">
                      Enter partial amounts below, or click <em>"Fill Remaining"</em> on any payment method to auto-cover the balance.
                    </small>
                  </div>
                )}

                <div className="row g-3">
                  {/* Cash Field */}
                  {(paymentMode === "cash" || paymentMode === "split") && (
                    <div className={paymentMode === "split" ? "col-md-12" : "col-12"}>
                      <div className="p-2 border rounded bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-bold mb-0 text-success">
                            💵 Cash ({symbol})
                          </label>
                          {paymentMode === "split" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success py-0 px-2"
                              style={{ fontSize: "0.8rem" }}
                              onClick={() => handleFillRemaining("cash")}
                            >
                              Fill Remaining ({symbol}{Math.max(0, parsedTotal - (cardNum + bankNum)).toFixed(2)})
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={cash === 0 && paymentMode === "split" ? "" : cash}
                          onChange={(e) => handleInputChange("cash", e.target.value)}
                          onFocus={() => focusField("cash")}
                          className="form-control form-control-lg text-end fw-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {/* Card Field */}
                  {(paymentMode === "card" || paymentMode === "split") && (
                    <div className={paymentMode === "split" ? "col-md-12" : "col-12"}>
                      <div className="p-2 border rounded bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-bold mb-0 text-primary">
                            💳 Card ({symbol})
                          </label>
                          {paymentMode === "split" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0 px-2"
                              style={{ fontSize: "0.8rem" }}
                              onClick={() => handleFillRemaining("card")}
                            >
                              Fill Remaining ({symbol}{Math.max(0, parsedTotal - (cashNum + bankNum)).toFixed(2)})
                            </button>
                          )}
                        </div>
                        <div className="row g-2">
                          <div className={cardNum > 0 || paymentMode === "card" ? "col-7" : "col-12"}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={card === 0 && paymentMode === "split" ? "" : card}
                              onChange={(e) => handleInputChange("card", e.target.value)}
                              onFocus={() => focusField("card")}
                              className="form-control form-control-lg text-end fw-bold"
                              placeholder="0.00"
                            />
                          </div>
                          {(cardNum > 0 || paymentMode === "card") && (
                            <div className="col-5">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength="4"
                                value={cardLast4}
                                onChange={(e) => handleInputChange("cardLast4", e.target.value)}
                                onFocus={() => focusField("cardLast4")}
                                className="form-control form-control-lg text-center"
                                placeholder="Last 4 Digits"
                                title="Card Last 4 Digits"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Field */}
                  {(paymentMode === "bank" || paymentMode === "split") && (
                    <div className={paymentMode === "split" ? "col-md-12" : "col-12"}>
                      <div className="p-2 border rounded bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-bold mb-0 text-info text-dark">
                            🏦 Bank Transfer ({symbol})
                          </label>
                          {paymentMode === "split" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              style={{ fontSize: "0.8rem" }}
                              onClick={() => handleFillRemaining("bankTransfer")}
                            >
                              Fill Remaining ({symbol}{Math.max(0, parsedTotal - (cashNum + cardNum)).toFixed(2)})
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={bankTransfer === 0 && paymentMode === "split" ? "" : bankTransfer}
                          onChange={(e) => handleInputChange("bankTransfer", e.target.value)}
                          onFocus={() => focusField("bankTransfer")}
                          className="form-control form-control-lg text-end fw-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <label className="form-label fw-semibold text-muted small">Notes / Remarks (Optional)</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="e.g. Paid Rs.1000 cash and Rs.1000 by HNB credit card"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-secondary px-4 py-2"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className={`btn px-4 py-2 fs-5 fw-bold ${totalPaid >= parsedTotal ? "btn-success shadow" : "btn-outline-danger"}`}
                    onClick={handleSubmit}
                    disabled={loading || totalPaid < parsedTotal}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : totalPaid < parsedTotal ? (
                      `⚠️ Pay Remaining (${symbol}${remainingNeeded.toFixed(2)})`
                    ) : (
                      `✅ Confirm Payment (${symbol}${totalPaid.toFixed(2)})`
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Number Pad */}
              <div className="col-md-5">
                <div className="card shadow-sm border h-100">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold small text-uppercase">
                      🔢 Keypad: <span className="text-primary">{numberPadTarget}</span>
                    </span>
                    {showNumberPad && (
                      <button
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        onClick={() => setShowNumberPad(false)}
                      >
                        Hide
                      </button>
                    )}
                  </div>
                  <div className="card-body p-3 d-flex flex-column justify-content-center">
                    <div className="row g-2">
                      <div className="col-6">
                        <button
                          type="button"
                          className="btn btn-outline-danger w-100 py-2 fw-bold"
                          onClick={handleClear}
                        >
                          CLEAR
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          type="button"
                          className="btn btn-light w-100 py-2 fw-bold border"
                          onClick={handleBackspace}
                        >
                          ⌫ Backspace
                        </button>
                      </div>

                      {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0"].map((num, i) => (
                        <div className={num === "0" ? "col-8" : "col-4"} key={num}>
                          <button
                            type="button"
                            className="btn btn-light w-100 py-3 fs-4 fw-semibold border shadow-sm"
                            onClick={() => handleNumberPadInput(num)}
                          >
                            {num}
                          </button>
                        </div>
                      ))}

                      <div className="col-4">
                        <button
                          type="button"
                          className="btn btn-light w-100 py-3 fs-4 fw-bold border shadow-sm"
                          onClick={handleDecimal}
                        >
                          .
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-center text-muted small">
                      Tap any amount input to switch keypad target.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;