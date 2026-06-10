import { notFound } from "next/navigation";
import { PrintButtons } from "./print-buttons";
import { requirePermission } from "@/lib/permissions/server";
import { getServiceTicketDetail } from "@/lib/services/service-ticket-service";
import { serviceTicketIdSchema } from "@/lib/validations/service-ticket";
import { getCompanyProfile } from "@/lib/company-profile";
import {
  SERVICE_TYPE_LABELS,
  SYSTEM_TYPE_LABELS,
  SERVICE_TICKET_STATUS_LABELS,
  SERVICE_PRIORITY_LABELS,
} from "@/lib/services/service-ticket-state-machine";
import { format } from "@/lib/utils/date-format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requirePermission("service:read");
  const t = await getServiceTicketDetail(user, id);
  return { title: t ? `Servis Fişi — ${t.ticketNo}` : "Servis Fişi" };
}

export default async function ServiceTicketPrintPage({ params }: Props) {
  const user = await requirePermission("service:read");
  const { id } = await params;

  if (!serviceTicketIdSchema.safeParse({ id }).success) notFound();

  const [ticket, company] = await Promise.all([
    getServiceTicketDetail(user, id),
    getCompanyProfile(),
  ]);

  if (!ticket) notFound();

  const contact = ticket.customer.contacts[0];
  const address = ticket.customer.addresses[0];
  const addressStr = address
    ? [address.line1, address.line2, address.district, address.city]
        .filter(Boolean)
        .join(", ")
    : null;

  const cur = ticket.currency as string;
  const sym = cur === "USD" ? "$" : cur === "EUR" ? "€" : "₺";

  function money(v: { toString(): string }) {
    return `${Number(v.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${sym}`;
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
        .page { max-width: 210mm; margin: 0 auto; padding: 14mm 16mm 20mm; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; margin-bottom: 12px; }
        .company-name { font-size: 16px; font-weight: bold; color: #1e3a5f; }
        .company-info { font-size: 9px; color: #666; margin-top: 2px; }
        .doc-title { text-align: right; }
        .doc-title h1 { font-size: 15px; font-weight: bold; color: #1e3a5f; letter-spacing: 0.5px; }
        .doc-title .ticket-no { font-size: 10px; color: #666; margin-top: 2px; }
        .doc-title .doc-date { font-size: 9px; color: #999; margin-top: 1px; }

        /* Section */
        .section { margin-bottom: 10px; }
        .section-header { background: #1e3a5f; color: #fff; padding: 3px 8px; font-size: 8px; font-weight: bold; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
        .field { display: flex; gap: 4px; margin-bottom: 3px; }
        .field-label { width: 100px; font-size: 9px; color: #888; font-weight: bold; flex-shrink: 0; }
        .field-value { font-size: 10px; color: #1a1a1a; flex: 1; }

        /* Text block */
        .text-block { border: 0.5px solid #e0e0e0; background: #fafafa; padding: 7px 9px; font-size: 10px; line-height: 1.6; min-height: 40px; white-space: pre-wrap; }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        th { background: #1e3a5f; color: #fff; padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: left; }
        th.right, td.right { text-align: right; }
        th.center, td.center { text-align: center; }
        td { padding: 4px 6px; font-size: 10px; border-bottom: 0.5px solid #e8e8e8; }
        tr:nth-child(even) td { background: #f7f9fb; }

        /* Totals */
        .totals { display: flex; flex-direction: column; align-items: flex-end; margin-top: 4px; gap: 2px; }
        .total-row { display: flex; gap: 0; }
        .total-label { width: 130px; text-align: right; padding-right: 10px; font-size: 10px; color: #666; }
        .total-value { width: 100px; text-align: right; font-size: 10px; }
        .total-row.grand .total-label { font-weight: bold; color: #1e3a5f; font-size: 11px; }
        .total-row.grand .total-value { font-weight: bold; color: #1e3a5f; font-size: 11px; border-top: 1px solid #1e3a5f; }

        /* Signatures */
        .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 28px; }
        .sig-box { border-top: 1px solid #ccc; padding-top: 8px; text-align: center; }
        .sig-space { height: 36px; }
        .sig-label { font-size: 9px; color: #888; margin-top: 4px; }
        .sig-name { font-size: 10px; font-weight: bold; margin-top: 2px; }
        .sig-date-line { border-top: 0.5px solid #ccc; margin-top: 20px; padding-top: 4px; font-size: 8px; color: #aaa; text-align: center; }

        /* Footer */
        .footer { margin-top: 16px; border-top: 0.5px solid #e0e0e0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 8px; color: #aaa; }

        /* Print button — hidden on print */
        .print-bar { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16mm; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
        .print-btn { background: #1e3a5f; color: #fff; border: none; padding: 8px 20px; font-size: 13px; border-radius: 4px; cursor: pointer; font-family: Arial, sans-serif; }
        .back-btn { background: #fff; color: #333; border: 1px solid #ccc; padding: 8px 16px; font-size: 13px; border-radius: 4px; cursor: pointer; font-family: Arial, sans-serif; }

        @media print {
          .print-bar { display: none; }
          .page { padding: 10mm 14mm 16mm; }
          body { font-size: 10px; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <PrintButtons />

      <div className="page">
        {/* ── Başlık ── */}
        <div className="header">
          <div>
            <div className="company-name">{company.companyName}</div>
            <div className="company-info">{company.address}</div>
            <div className="company-info">{company.phone}{company.email ? ` · ${company.email}` : ""}</div>
          </div>
          <div className="doc-title">
            <h1>TEKNİK SERVİS FORMU</h1>
            <div className="ticket-no">{ticket.ticketNo}</div>
            <div className="doc-date">Tarih: {format(ticket.openedAt, "date")}</div>
          </div>
        </div>

        {/* ── Servis & Müşteri ── */}
        <div className="section">
          <div className="section-header">Servis Bilgileri</div>
          <div className="grid-2">
            <div>
              <div className="field"><span className="field-label">Servis No</span><span className="field-value">{ticket.ticketNo}</span></div>
              <div className="field"><span className="field-label">Tarih</span><span className="field-value">{format(ticket.openedAt, "date")}</span></div>
              <div className="field"><span className="field-label">Servis Türü</span><span className="field-value">{SERVICE_TYPE_LABELS[ticket.serviceType] ?? ticket.serviceType}</span></div>
              <div className="field"><span className="field-label">Durum</span><span className="field-value">{SERVICE_TICKET_STATUS_LABELS[ticket.status as keyof typeof SERVICE_TICKET_STATUS_LABELS] ?? ticket.status}</span></div>
            </div>
            <div>
              <div className="field"><span className="field-label">Öncelik</span><span className="field-value">{SERVICE_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</span></div>
              {ticket.assignedUser && (
                <div className="field"><span className="field-label">Teknisyen</span><span className="field-value">{ticket.assignedUser.firstName} {ticket.assignedUser.lastName}</span></div>
              )}
              {ticket.closedAt && (
                <div className="field"><span className="field-label">Kapanış</span><span className="field-value">{format(ticket.closedAt, "date")}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">Müşteri Bilgileri</div>
          <div className="grid-2">
            <div>
              <div className="field"><span className="field-label">Firma</span><span className="field-value">{ticket.customer.legalName}</span></div>
              {contact?.fullName && (
                <div className="field"><span className="field-label">Yetkili</span><span className="field-value">{contact.fullName}</span></div>
              )}
            </div>
            <div>
              {contact?.phone && (
                <div className="field"><span className="field-label">Telefon</span><span className="field-value">{contact.phone}</span></div>
              )}
              {contact?.email && (
                <div className="field"><span className="field-label">E-Posta</span><span className="field-value">{contact.email}</span></div>
              )}
              {addressStr && (
                <div className="field"><span className="field-label">Adres</span><span className="field-value">{addressStr}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* ── Cihaz Bilgileri ── */}
        {(ticket.systemType || ticket.brand || ticket.model || ticket.serialNo || ticket.location || ticket.inventoryNo) && (
          <div className="section">
            <div className="section-header">Sistem / Cihaz Bilgileri</div>
            <div className="grid-2">
              <div>
                {ticket.systemType && <div className="field"><span className="field-label">Sistem Türü</span><span className="field-value">{SYSTEM_TYPE_LABELS[ticket.systemType] ?? ticket.systemType}</span></div>}
                {ticket.brand && <div className="field"><span className="field-label">Marka</span><span className="field-value">{ticket.brand}</span></div>}
                {ticket.model && <div className="field"><span className="field-label">Model</span><span className="field-value">{ticket.model}</span></div>}
              </div>
              <div>
                {ticket.serialNo && <div className="field"><span className="field-label">Seri No</span><span className="field-value">{ticket.serialNo}</span></div>}
                {ticket.location && <div className="field"><span className="field-label">Lokasyon</span><span className="field-value">{ticket.location}</span></div>}
                {ticket.inventoryNo && <div className="field"><span className="field-label">Envanter No</span><span className="field-value">{ticket.inventoryNo}</span></div>}
              </div>
            </div>
          </div>
        )}

        {/* ── Talep / Arıza ── */}
        {ticket.description && (
          <div className="section">
            <div className="section-header">Müşteri Talebi / Arıza Bildirimi</div>
            <div className="text-block">{ticket.description}</div>
          </div>
        )}

        {/* ── Yapılan İşlemler ── */}
        <div className="section">
          <div className="section-header">Yapılan İşlemler</div>
          <div className="text-block" style={{ minHeight: ticket.workDone ? undefined : "60px" }}>
            {ticket.workDone ?? ""}
          </div>
        </div>

        {/* ── Malzeme & Hizmetler ── */}
        {ticket.lineItems.length > 0 && (
          <div className="section">
            <div className="section-header">Kullanılan Malzeme ve Hizmetler</div>
            <table>
              <thead>
                <tr>
                  <th>Açıklama</th>
                  <th className="right" style={{ width: 50 }}>Miktar</th>
                  <th className="center" style={{ width: 42 }}>Birim</th>
                  <th className="right" style={{ width: 80 }}>Birim Fiyat</th>
                  <th className="right" style={{ width: 40 }}>KDV%</th>
                  <th className="right" style={{ width: 90 }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {ticket.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td>{li.description}</td>
                    <td className="right">{Number(li.quantity.toString()).toLocaleString("tr-TR")}</td>
                    <td className="center">{li.unit}</td>
                    <td className="right">{Number(li.unitPrice.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                    <td className="right">%{Number(li.taxRate.toString())}</td>
                    <td className="right">{money(li.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="totals">
              <div className="total-row">
                <span className="total-label">Ara Toplam</span>
                <span className="total-value">{money(ticket.subtotal)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">KDV</span>
                <span className="total-value">{money(ticket.taxTotal)}</span>
              </div>
              <div className="total-row grand">
                <span className="total-label">Genel Toplam</span>
                <span className="total-value">{money(ticket.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── İmza Alanları ── */}
        <div className="signatures">
          <div className="sig-box">
            <div className="sig-space"></div>
            <div className="sig-label">Teknik Servis Yetkilisi</div>
            <div className="sig-name">
              {ticket.assignedUser
                ? `${ticket.assignedUser.firstName} ${ticket.assignedUser.lastName}`
                : ""}
            </div>
          </div>
          <div className="sig-box">
            <div className="sig-space"></div>
            <div className="sig-label">Müşteri Yetkilisi</div>
            <div className="sig-name">{contact?.fullName ?? ""}</div>
          </div>
          <div className="sig-box">
            <div className="sig-space"></div>
            <div className="sig-label">Tarih</div>
            <div className="sig-date-line">...../...../............</div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="footer">
          <span>{ticket.ticketNo} · {ticket.customer.legalName}</span>
          <span>{company.companyName} · {company.phone}</span>
        </div>
      </div>
    </>
  );
}
