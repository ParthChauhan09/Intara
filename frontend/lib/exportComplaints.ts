import type { Complaint } from "@/lib/state/ComplaintsManager";

// ── CSV ──────────────────────────────────────────────────────────────────────

function escapeCsv(value: string | undefined | null): string {
  const str = value ?? "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(complaints: Complaint[], filename = "complaints.csv") {
  const headers = ["ID", "Description", "Category", "Priority", "Status", "SLA Deadline", "Created At"];
  const rows = complaints.map((c) => [
    escapeCsv(c.id),
    escapeCsv(c.description),
    escapeCsv(c.category),
    escapeCsv(c.priority),
    escapeCsv(c.status),
    escapeCsv(c.slaDeadline ?? ""),
    escapeCsv(c.createdAt),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── PDF ──────────────────────────────────────────────────────────────────────

export async function exportToPdf(complaints: Complaint[], filename = "complaints.pdf") {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-950
  doc.text("Complaints Report", 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${complaints.length}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["ID", "Description", "Category", "Priority", "Status", "SLA Deadline", "Created At"]],
    body: complaints.map((c) => [
      c.id,
      c.description,
      c.category ?? "—",
      c.priority ?? "—",
      c.status,
      c.slaDeadline ?? "—",
      c.createdAt,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 80 },
    },
  });

  doc.save(filename);
}
