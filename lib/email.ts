import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendAuditDefectAlert(params: {
  branchName: string;
  auditorName: string;
  auditDate: string;
  failingItemsCount: number;
  recipientEmail: string;
}) {
  if (!resend) {
    console.log("[Resend Email Mock Dispatch]:", params);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: "Branch Audit System <audit@notifications.yourcompany.com>",
      to: [params.recipientEmail],
      subject: `🚨 แจ้งเตือนข้อบกพร่องสาขา: ${params.branchName} (${params.auditDate})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E3E7ED; border-radius: 12px;">
          <h2 style="color: #12294B;">การตรวจประเมินสาขาพบข้อบกพร่อง</h2>
          <p><strong>สาขา:</strong> ${params.branchName}</p>
          <p><strong>วันที่ตรวจ:</strong> ${params.auditDate}</p>
          <p><strong>ผู้ตรวจประเมิน:</strong> ${params.auditorName}</p>
          <div style="background-color: #FBEAEA; color: #C23B3B; padding: 12px; border-radius: 8px; font-weight: bold; margin: 16px 0;">
            พบหัวข้อที่ไม่ผ่าน / ต้องปรับปรุงจำนวน: ${params.failingItemsCount} รายการ
          </div>
          <p>กรุณาเข้าสู่ระบบ Branch Audit เพื่อตรวจสอบรายละเอียดและแนบภาพถ่ายการแก้ไข (After Photo) เพื่อปิด Action Item</p>
          <hr style="border: none; border-top: 1px solid #E3E7ED; margin: 20px 0;" />
          <p style="font-size: 12px; color: #5B6472;">ระบบ Branch Audit System &copy; 2026</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Resend Email Error:", error);
    return { success: false, error };
  }
}
