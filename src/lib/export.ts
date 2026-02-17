import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

interface ExportListing {
  address: string;
  city: string;
  state: string;
  zip: string | null;
  propertyType: string;
  listingType: string;
  buildingSf: number | null;
  priceAmount: number | null;
  priceUnit: string | null;
  yearBuilt: number | null;
  brokerName: string | null;
  brokerCompany: string | null;
  status: string;
}

export function generateExcel(listings: ExportListing[]): Buffer {
  const rows = listings.map((l) => ({
    Address: l.address,
    City: l.city,
    State: l.state,
    ZIP: l.zip ?? "",
    "Property Type": l.propertyType,
    "Listing Type": l.listingType,
    "Building SF": l.buildingSf ?? "",
    Price: l.priceAmount ?? "",
    "Price Unit": l.priceUnit ?? "",
    "Year Built": l.yearBuilt ?? "",
    Broker: l.brokerName ?? "",
    "Broker Company": l.brokerCompany ?? "",
    Status: l.status,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Listings");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

export function generateCSV(listings: ExportListing[]): string {
  const headers = [
    "Address", "City", "State", "ZIP", "Property Type", "Listing Type",
    "Building SF", "Price", "Price Unit", "Year Built", "Broker", "Broker Company", "Status",
  ];

  const rows = listings.map((l) =>
    [
      l.address, l.city, l.state, l.zip ?? "", l.propertyType, l.listingType,
      l.buildingSf?.toString() ?? "", l.priceAmount?.toString() ?? "",
      l.priceUnit ?? "", l.yearBuilt?.toString() ?? "",
      l.brokerName ?? "", l.brokerCompany ?? "", l.status,
    ].map((v) => `"${v.replace(/"/g, '""')}"`)
     .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function generatePDF(listings: ExportListing[]): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text("AtlasCRE - Listing Export", 14, 20);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

  const headers = ["Address", "City", "Type", "Listing", "SF", "Price", "Broker"];
  const startY = 35;
  const rowHeight = 7;
  const colWidths = [60, 30, 25, 20, 25, 30, 50];

  // Header row
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let x = 14;
  headers.forEach((h, i) => {
    doc.text(h, x, startY);
    x += colWidths[i];
  });

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const maxRows = Math.min(listings.length, 40); // fit on one page
  for (let r = 0; r < maxRows; r++) {
    const l = listings[r];
    const y = startY + (r + 1) * rowHeight;
    x = 14;
    const vals = [
      l.address.substring(0, 35),
      l.city,
      l.propertyType,
      l.listingType,
      l.buildingSf?.toLocaleString() ?? "",
      l.priceAmount ? `$${l.priceAmount.toLocaleString()}` : "",
      (l.brokerName ?? "").substring(0, 30),
    ];
    vals.forEach((v, i) => {
      doc.text(v, x, y);
      x += colWidths[i];
    });
  }

  if (listings.length > maxRows) {
    doc.setFontSize(8);
    doc.text(
      `Showing ${maxRows} of ${listings.length} listings. Export to Excel for full data.`,
      14,
      startY + (maxRows + 2) * rowHeight
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
