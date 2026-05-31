/**
 * Préparation de l'export PDF du carnet (fonctionnalité premium future).
 *
 * On NE génère PAS encore le PDF ici (jsPDF sera ajouté quand le statut premium
 * activera la fonctionnalité). Ce module assemble le « modèle d'export » : une
 * structure complète et stable que le futur générateur n'aura plus qu'à parcourir
 * pour produire couverture, pages et photo souvenir en haute qualité.
 *
 * Garder cette fonction synchrone et pure : elle ne fait que mettre en forme des
 * données déjà chargées (carnet) + le contexte famille + le souvenir éventuel.
 */
export function buildCarnetExportModel(carnet, { team, souvenir } = {}) {
  if (!carnet) return null
  const { trail, naturalist, pages } = carnet

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      format: 'A5-portrait',
      app: 'Terra Azur Explorer',
    },
    cover: {
      trailName: trail.nom,
      region: trail.region || 'Côte d’Azur',
      portraitSrc: naturalist ? `/illustrations/naturalists/${trail.id}.png` : null,
      naturalistName: naturalist?.name || null,
      naturalistPeriod: naturalist?.period || null,
      intro: naturalist?.intro || trail.description || '',
    },
    pages: pages.map((p, i) => ({
      index: i + 1,
      missionId: p.mission.id,
      title: p.mission.titre,
      category: p.mission.categorie,
      illustrationSrc: `/illustrations/missions/${p.mission.id}.png`,
      journalText: p.unlocked ? (p.narrative?.journal_text || p.mission.texte || '') : null,
      unlocked: p.unlocked,
    })),
    closing: {
      mystery: naturalist?.ending || null,
      souvenirDataUrl: souvenir?.dataUrl || null,
      familyName: team?.name || null,
      explorers: Array.isArray(team?.members) ? team.members.filter(Boolean) : [],
      date: souvenir?.date || carnet.lastUpdate || null,
    },
  }
}
