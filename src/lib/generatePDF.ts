import { jsPDF } from 'jspdf'
import { Player } from './supabase'

export async function generateResultsPDF(players: Player[], gameCode?: string) {
  const doc = new jsPDF()
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  
  // Title
  doc.setFontSize(28)
  doc.setTextColor(255, 0, 255) // Neon pink
  doc.text('CULTIQUIZ!!', 105, 25, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setTextColor(0, 255, 255) // Cyan
  doc.text('Resultater', 105, 35, { align: 'center' })
  
  if (gameCode) {
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(`Spilkode: ${gameCode}`, 105, 42, { align: 'center' })
  }
  
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(`Dato: ${new Date().toLocaleDateString('da-DK')}`, 105, 48, { align: 'center' })

  let yPos = 60
  const imageSize = 45 // Large portrait size
  const rowHeight = 55

  // Players list
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i]
    const rank = i + 1
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Rank
    doc.setFontSize(18)
    doc.setTextColor(80, 80, 80)
    doc.text(`#${rank}`, 20, yPos + 20)

    // Portrait (large!)
    if (player.portrait) {
      try {
        doc.addImage(player.portrait, 'PNG', 35, yPos, imageSize, imageSize)
      } catch (e) {
        // If image fails, draw placeholder
        doc.setDrawColor(200, 200, 200)
        doc.rect(35, yPos, imageSize, imageSize)
        doc.setFontSize(24)
        doc.setTextColor(200, 200, 200)
        doc.text('?', 35 + imageSize/2, yPos + imageSize/2 + 8, { align: 'center' })
      }
    } else {
      doc.setDrawColor(200, 200, 200)
      doc.rect(35, yPos, imageSize, imageSize)
      doc.setFontSize(24)
      doc.setTextColor(200, 200, 200)
      doc.text('?', 35 + imageSize/2, yPos + imageSize/2 + 8, { align: 'center' })
    }

    // Name
    doc.setFontSize(16)
    doc.setTextColor(50, 50, 50)
    doc.text(player.name, 88, yPos + 18)

    // Score
    doc.setFontSize(14)
    doc.setTextColor(0, 150, 0)
    doc.text(`${player.score.toLocaleString()} point`, 88, yPos + 32)

    yPos += rowHeight
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Genereret af CULTIQUIZ!!', 105, 290, { align: 'center' })

  // Download
  doc.save(`cultiquiz-resultater-${new Date().toISOString().split('T')[0]}.pdf`)
}
