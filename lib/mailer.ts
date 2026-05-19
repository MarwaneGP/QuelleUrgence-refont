import { Resend } from 'resend';
import { Dossier, URGENCY_COLORS } from '@/types/triage';

export async function sendDossierEmail(dossier: Dossier): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const dossierUrl = `${baseUrl}/dossier/${dossier.accessCode}`;
  const urgencyColor = URGENCY_COLORS[dossier.triage.urgencyLevel];

  const topHospitals = dossier.hospitals.slice(0, 3);

  const hospitalsHtml = topHospitals
    .map(
      (h, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${i + 1}. ${h.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${h.distance.toFixed(1)} km</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${h.waitTime ? `~${h.waitTime} min` : 'N/A'}</td>
      </tr>`
    )
    .join('');

  await resend.emails.send({
    from: 'QuelleUrgence <noreply@quelleurgence.fr>',
    to: dossier.patient.email,
    subject: `Votre dossier médical QuelleUrgence — ${dossier.accessCode}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;">QuelleUrgence</h1>
      <p style="margin:4px 0 0;color:#aaa;font-size:14px;">Votre dossier médical de triage</p>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#333;">Bonjour <strong>${dossier.patient.firstName} ${dossier.patient.lastName}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;">Suite à votre appel, votre dossier médical a été créé. Présentez ce code ou ce QR code à votre arrivée aux urgences.</p>

      <div style="background:#f8f8f8;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#666;font-size:13px;">VOTRE CODE D'ACCÈS</p>
        <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:4px;color:#1a1a2e;">${dossier.accessCode}</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <img src="${dossier.qrCodeDataUrl}" alt="QR Code" style="width:180px;height:180px;border-radius:8px;" />
        <p style="margin:8px 0 0;color:#888;font-size:12px;">Scannez pour accéder au dossier</p>
      </div>

      <div style="background:${urgencyColor}22;border-left:4px solid ${urgencyColor};border-radius:4px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-weight:600;color:${urgencyColor};">Niveau d'urgence : ${dossier.triage.urgencyLabel}</p>
        <p style="margin:0;color:#555;font-size:14px;">${dossier.triage.recommendation}</p>
      </div>

      ${
        topHospitals.length > 0
          ? `
      <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:16px;">Hôpitaux recommandés</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;">Hôpital</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;">Distance</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;">Attente</th>
          </tr>
        </thead>
        <tbody>${hospitalsHtml}</tbody>
      </table>`
          : ''
      }

      <a href="${dossierUrl}" style="display:block;text-align:center;background:#1a1a2e;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">
        Voir le dossier complet
      </a>

      <p style="margin:0;color:#999;font-size:12px;text-align:center;">
        Ce dossier a été créé le ${new Date(dossier.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })} à ${new Date(dossier.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.<br/>
        En cas d'urgence vitale, appelez le <strong>15</strong> ou le <strong>112</strong>.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}
