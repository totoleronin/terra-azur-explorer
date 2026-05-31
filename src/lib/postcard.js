/**
 * Génère une carte postale souvenir (canvas HTML) à partir de la photo de
 * l'explorateur. Tout est local : rien n'est envoyé sur un serveur.
 *
 * Retourne une Promise<dataUrl PNG>.
 *
 *   buildPostcard({ photoDataUrl, trailName, naturalistName, family, date })
 *
 * Format 1080×1350 (4:5, adapté au partage). Cadre parchemin, photo recadrée
 * en « cover », titre du sentier, signature du naturaliste, équipée + date.
 */
export function buildPostcard({ photoDataUrl, trailName, naturalistName, family, date }) {
  return new Promise((resolve, reject) => {
    const W = 1080, H = 1350
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')

    // Fond parchemin
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#f6eed9')
    grad.addColorStop(1, '#e7d8b4')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Cadre extérieur
    ctx.strokeStyle = '#b8862e'
    ctx.lineWidth = 8
    ctx.strokeRect(28, 28, W - 56, H - 56)

    const img = new Image()
    img.onload = () => {
      // Zone photo
      const px = 70, py = 70, pw = W - 140, ph = 820
      // Recadrage cover
      const ir = img.width / img.height
      const fr = pw / ph
      let sx, sy, sw, sh
      if (ir > fr) { sh = img.height; sw = sh * fr; sx = (img.width - sw) / 2; sy = 0 }
      else { sw = img.width; sh = sw / fr; sx = 0; sy = (img.height - sh) / 2 }
      ctx.save()
      ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip()
      ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph)
      ctx.restore()
      // Cadre photo
      ctx.strokeStyle = '#2b2620'; ctx.lineWidth = 5
      ctx.strokeRect(px, py, pw, ph)

      // Bandeau texte
      let y = py + ph + 90
      ctx.textAlign = 'center'
      ctx.fillStyle = '#8a7e6c'
      ctx.font = '600 26px Georgia, serif'
      ctx.fillText('SOUVENIR D’EXPLORATION', W / 2, y)

      y += 78
      ctx.fillStyle = '#2b2620'
      ctx.font = '700 64px Georgia, serif'
      wrapCenter(ctx, (trailName || 'Terra Azur').toUpperCase(), W / 2, y, W - 160, 64)

      y += 96
      if (naturalistName) {
        ctx.fillStyle = '#a14a3c'
        ctx.font = 'italic 30px Georgia, serif'
        ctx.fillText(`Carnet d’${naturalistName}`, W / 2, y)
        y += 56
      }

      // Pied : famille + date
      ctx.fillStyle = '#5a4f42'
      ctx.font = '600 30px Georgia, serif'
      const footer = [family, formatDate(date)].filter(Boolean).join('  ·  ')
      if (footer) ctx.fillText(footer, W / 2, H - 110)

      ctx.fillStyle = '#b8862e'
      ctx.font = '600 22px Georgia, serif'
      ctx.fillText('TERRA AZUR EXPLORER', W / 2, H - 64)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = photoDataUrl
  })
}

function wrapCenter(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ')
  let line = '', lines = []
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w }
    else line = test
  }
  if (line) lines.push(line)
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineH))
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return '' }
}
