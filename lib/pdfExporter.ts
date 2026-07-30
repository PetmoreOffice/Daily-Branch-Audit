import { Audit } from "@/lib/types/audit";
import { branchName, TEMPLATE, ALL_ITEMS, avgScore, statusFromScore, EMPLOYEES } from "@/lib/mock-data";

/**
 * Generates an official corporate PDF report for a given Audit record
 * and triggers the native browser PDF print/download engine.
 */
export function exportAuditToPDF(audit: Audit) {
  const bName = branchName(audit.branchId);
  const avg = avgScore(audit.items);
  const status = statusFromScore(avg, 5);
  const [y, m, d] = audit.date.split("-");
  const formattedDate = `${d}/${m}/${y}`;

  // Status color styling
  let statusBg = "#E8F5EE";
  let statusColor = "#1E8E5A";
  let statusBorder = "#BBE4CE";
  if (status === "ต้องปรับปรุง") {
    statusBg = "#FCF1DE";
    statusColor = "#C77C00";
    statusBorder = "#F6D9A9";
  } else if (status === "ร้ายแรง") {
    statusBg = "#FBEAEA";
    statusColor = "#C23B3B";
    statusBorder = "#F3C5C5";
  }

  // Build section items table rows
  const sectionsHtml = TEMPLATE.sections
    .map((sec) => {
      const secItemIds = sec.items.map((it) => it.id);
      const secAuditItems = audit.items.filter((i) => secItemIds.includes(i.itemId));

      if (secAuditItems.length === 0) return "";

      const rows = secAuditItems
        .map((item) => {
          const itemDef = ALL_ITEMS.find((it) => it.id === item.itemId || it.name === item.itemId);
          const name = itemDef ? itemDef.name : item.itemId;
          const isPass = item.status === "ผ่าน";

          const staffNames = (item.responsibleIds || [])
            .map((empId) => {
              const emp = EMPLOYEES.find((e) => e.id === empId);
              return emp ? `${emp.firstName} ${emp.lastName}` : empId;
            })
            .join(", ");

          return `
            <tr>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #1E293B;">
                <strong>${name}</strong>
                ${item.note ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">📝 โน้ต: ${item.note}</div>` : ""}
                ${staffNames ? `<div style="font-size: 10px; color: #2563EB; margin-top: 2px;">👤 ผู้รับผิดชอบ: ${staffNames}</div>` : ""}
              </td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 12px; font-weight: bold; color: #0F172A;">
                ${item.score} / 5
              </td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; text-align: center;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; background: ${isPass ? "#E8F5EE" : "#FBEAEA"}; color: ${isPass ? "#1E8E5A" : "#C23B3B"}; border: 1px solid ${isPass ? "#BBE4CE" : "#F3C5C5"};">
                  ${item.status}
                </span>
              </td>
            </tr>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom: 16px; break-inside: avoid;">
          <div style="background: #F1F5F9; padding: 6px 12px; font-size: 12px; font-weight: bold; color: #0F172A; border-left: 4px solid #1E3A8A; border-radius: 4px; margin-bottom: 6px;">
            ${sec.name}
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #F8FAFC; text-align: left; font-size: 11px; color: #64748B; border-bottom: 2px solid #CBD5E1;">
                <th style="padding: 6px 10px; width: 65%;">หัวข้อการตรวจประเมิน</th>
                <th style="padding: 6px 10px; text-align: center; width: 17%;">คะแนนที่ได้</th>
                <th style="padding: 6px 10px; text-align: center; width: 18%;">ผลประเมิน</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("โปรดอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อดาวน์โหลดไฟล์ PDF");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>รายงานผลการตรวจประเมิน - ${audit.id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
        @page {
          size: A4;
          margin: 12mm 15mm;
        }
        body {
          font-family: 'Sarabun', sans-serif;
          color: #0F172A;
          margin: 0;
          padding: 20px;
          background: #FFFFFF;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #0F172A;
          margin-bottom: 16px;
        }
        .logo-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
        }
        .subtitle {
          font-size: 12px;
          color: #64748B;
          margin-top: 2px;
        }
        .doc-id {
          text-align: right;
          font-size: 12px;
          font-weight: bold;
          color: #1E3A8A;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .score-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: ${statusBg};
          border: 1px solid ${statusBorder};
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .score-value {
          font-size: 24px;
          font-weight: 800;
          color: ${statusColor};
        }
        .status-badge {
          font-size: 14px;
          font-weight: 800;
          color: ${statusColor};
        }
        .signature-section {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
          break-inside: avoid;
        }
        .sig-box {
          width: 45%;
          text-align: center;
          border-top: 1px stroke #94A3B8;
          padding-top: 40px;
          position: relative;
        }
        .sig-line {
          border-bottom: 1px stroke #94A3B8;
          margin-bottom: 6px;
        }
        .sig-label {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo-title">BRANCH AUDIT SYSTEM</div>
          <div class="subtitle">รายงานสรุปผลการตรวจประเมินมาตรฐานสาขาประจำวัน</div>
        </div>
        <div class="doc-id">
          <div>รหัสเอกสาร: ${audit.id}</div>
          <div style="font-size: 11px; font-weight: normal; color: #64748B; margin-top: 2px;">วันที่ออกเอกสาร: ${formattedDate}</div>
        </div>
      </div>

      <div class="info-grid">
        <div><strong>สาขาที่รับการตรวจ:</strong> ${bName} (${audit.branchId})</div>
        <div><strong>ผู้ตรวจประเมิน:</strong> ${audit.auditor}</div>
        <div><strong>วันที่ตรวจประเมิน:</strong> ${formattedDate}</div>
        <div><strong>จำนวนหัวข้อที่ตรวจ:</strong> ${audit.items.length} หัวข้อ</div>
      </div>

      <div class="score-banner">
        <div>
          <div style="font-size: 11px; color: #64748B; font-weight: bold; text-transform: uppercase;">ผลคะแนนการประเมินภาพรวม</div>
          <div class="score-value">${avg.toFixed(2)} <span style="font-size: 14px; font-weight: normal; color: #64748B;">/ 5.00</span></div>
        </div>
        <div class="status-badge">
          ผลการประเมิน: ${status}
        </div>
      </div>

      <div style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #0F172A;">
        📋 รายละเอียดผลการประเมินรายหมวด
      </div>

      ${sectionsHtml}

      <div class="signature-section">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">ลงชื่อ ...........................................................</div>
          <div class="sig-label">(${audit.auditor})</div>
          <div class="sig-label" style="margin-top: 2px;">ตำแหน่ง: ผู้ตรวจประเมินสาขา</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">ลงชื่อ ...........................................................</div>
          <div class="sig-label">(ผู้จัดการสาขา / ผู้แทนรับการตรวจ)</div>
          <div class="sig-label" style="margin-top: 2px;">ตำแหน่ง: ผู้จัดการสาขา ${bName}</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
