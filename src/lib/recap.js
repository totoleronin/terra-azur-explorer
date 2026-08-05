export function buildRecap({ format, trailName, distance, duree, denivele, missionsCount, family, date, elapsed, photoDataUrl }) {
  const SQUARE = format === 'square'
  const W = 1080
  const H = SQUARE ? 1080 : 1920
  const hasPhoto = !!photoDataUrl

  return new Promise((resolve, reject) => {
    function render(img) {
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')

      // Fond sombre texturé
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#1a1610')
      bg.addColorStop(0.5, '#14110c')
      bg.addColorStop(1, '#0e0c08')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Grain subtil
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(244,236,216,${Math.random() * 0.025})`
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
      }

      // Photo souvenir (si disponible)
      const photoH = SQUARE ? 480 : 820
      const photoMargin = 56
      let contentStartY = SQUARE ? 60 : 80

      if (img) {
        const px = photoMargin, py = photoMargin
        const pw = W - photoMargin * 2, ph = photoH
        const ir = img.width / img.height, fr = pw / ph
        let sx, sy, sw, sh
        if (ir > fr) { sh = img.height; sw = sh * fr; sx = (img.width - sw) / 2; sy = 0 }
        else { sw = img.width; sh = sw / fr; sx = 0; sy = (img.height - sh) / 2 }

        // Cadre photo avec coins arrondis
        ctx.save()
        roundRect(ctx, px, py, pw, ph, 16)
        ctx.clip()
        ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph)
        // Vignette sombre en bas de la photo pour la transition
        const vign = ctx.createLinearGradient(0, py + ph - 120, 0, py + ph)
        vign.addColorStop(0, 'rgba(14,12,8,0)')
        vign.addColorStop(1, 'rgba(14,12,8,0.7)')
        ctx.fillStyle = vign
        ctx.fillRect(px, py + ph - 120, pw, 120)
        ctx.restore()

        // Bordure photo
        ctx.strokeStyle = 'rgba(184,134,46,0.5)'
        ctx.lineWidth = 2
        roundRect(ctx, px, py, pw, ph, 16)
        ctx.stroke()

        contentStartY = py + ph + (SQUARE ? 30 : 50)
      }

      // Cadre extérieur
      ctx.strokeStyle = '#b8862e'
      ctx.lineWidth = 3
      ctx.strokeRect(36, 36, W - 72, H - 72)
      ctx.strokeStyle = 'rgba(184,134,46,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(46, 46, W - 92, H - 92)

      ctx.textAlign = 'center'

      if (!hasPhoto) {
        // Sans photo : ornement haut
        ctx.fillStyle = '#b8862e'
        ctx.font = '600 18px Georgia, serif'
        ctx.fillText('✦  ✦  ✦', W / 2, contentStartY)
        contentStartY += 52
      }

      // « EXPLORATION ACCOMPLIE »
      ctx.fillStyle = 'rgba(201,183,138,0.6)'
      ctx.font = '600 22px Georgia, serif'
      ctx.fillText('EXPLORATION ACCOMPLIE', W / 2, contentStartY)

      // Nom du sentier
      const titleY = contentStartY + (SQUARE ? 55 : 70)
      ctx.fillStyle = '#f4ecd8'
      ctx.font = hasPhoto ? '700 56px Georgia, serif' : '700 72px Georgia, serif'
      const titleLineH = hasPhoto ? 60 : 76
      const titleLines = wrapCenter(ctx, (trailName || 'Terra Azur').toUpperCase(), W / 2, titleY, W - 180, titleLineH)

      // Séparateur
      const sepY = titleY + titleLines * titleLineH + 20
      ctx.strokeStyle = 'rgba(184,134,46,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(W / 2 - 180, sepY)
      ctx.lineTo(W / 2 + 180, sepY)
      ctx.stroke()

      // Stats
      const statsY = sepY + (SQUARE ? 50 : 65)
      const stats = []
      if (distance) stats.push({ label: 'DISTANCE', value: typeof distance === 'number' ? `${distance} km` : distance })
      if (elapsed) stats.push({ label: 'DURÉE', value: elapsed })
      else if (duree) stats.push({ label: 'DURÉE', value: duree })
      if (denivele) stats.push({ label: 'DÉNIVELÉ', value: `D+ ${denivele} m` })
      if (missionsCount) stats.push({ label: 'DÉCOUVERTES', value: `${missionsCount}` })

      const colW = Math.min(200, (W - 160) / stats.length)
      const startX = W / 2 - (stats.length * colW) / 2 + colW / 2

      stats.forEach((s, i) => {
        const cx = startX + i * colW
        ctx.fillStyle = '#b8862e'
        ctx.font = '700 46px Georgia, serif'
        ctx.fillText(s.value, cx, statsY)
        ctx.fillStyle = 'rgba(201,183,138,0.5)'
        ctx.font = '600 13px Georgia, serif'
        ctx.fillText(s.label, cx, statsY + 26)
      })

      // Équipe / famille
      const footZone = SQUARE ? H - 130 : H - 200
      if (family) {
        ctx.fillStyle = '#c9b78a'
        ctx.font = '600 28px Georgia, serif'
        ctx.fillText(family, W / 2, footZone)
      }

      // Date
      const dateStr = formatDate(date)
      if (dateStr) {
        ctx.fillStyle = 'rgba(201,183,138,0.45)'
        ctx.font = '600 20px Georgia, serif'
        ctx.fillText(dateStr, W / 2, footZone + 38)
      }

      // Branding
      ctx.fillStyle = '#b8862e'
      ctx.font = '700 24px Georgia, serif'
      ctx.fillText('TERRA AZUR EXPLORER', W / 2, H - 68)

      ctx.fillStyle = 'rgba(184,134,46,0.5)'
      ctx.font = '600 14px Georgia, serif'
      ctx.fillText('✦', W / 2, H - 44)

      resolve(canvas.toDataURL('image/png'))
    }

    if (hasPhoto) {
      const img = new Image()
      img.onload = () => render(img)
      img.onerror = () => render(null)
      img.src = photoDataUrl
    } else {
      render(null)
    }
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
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
  return lines.length
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return '' }
}
