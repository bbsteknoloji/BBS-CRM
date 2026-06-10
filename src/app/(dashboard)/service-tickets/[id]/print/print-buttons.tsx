"use client";

export function PrintButtons() {
  return (
    <div className="print-bar">
      <button className="back-btn" onClick={() => history.back()} type="button">
        ← Geri
      </button>
      <button className="print-btn" onClick={() => window.print()} type="button">
        🖨 Yazdır
      </button>
    </div>
  );
}
