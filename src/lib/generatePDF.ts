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

  // Players list
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i]
    const rank = i + 1
    
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }

    // Background for winner
    if (rank === 1) {
      doc.setFillColor(255, 215, 0, 0.2)
      doc.rect(15, yPos - 8, 180, 35, 'F')
    }

    // Rank
    doc.setFontSize(rank === 1 ? 24 : 16)
    doc.setTextColor(rank === 1 ? 255 : rank === 2 ? 192 : rank === 3 ? 205 : 100, 
                     rank === 1 ? 215 : rank === 2 ? 192 : rank === 3 ? 127 : 100, 
                     rank === 1 ? 0 : rank === 2 ? 192 : rank === 3 ? 50 : 100)
    doc.text(`#${rank}`, 20, yPos + 5)

    // Portrait (if available)
    if (player.portrait) {
      try {
        doc.addImage(player.portrait, 'PNG', 40, yPos - 8, 25, 25)
      } catch (e) {
        // If image fails, draw placeholder
        doc.setDrawColor(200, 200, 200)
        doc.rect(40, yPos - 8, 25, 25)
        doc.setFontSize(16)
        doc.setTextColor(200, 200, 200)
        doc.text('?', 52, yPos + 8, { align: 'center' })
      }
    } else {
      doc.setDrawColor(200, 200, 200)
      doc.rect(40, yPos - 8, 25, 25)
      doc.setFontSize(16)
      doc.setTextColor(200, 200, 200)
      doc.text('?', 52, yPos + 8, { align: 'center' })
    }

    // Name
    doc.setFontSize(rank === 1 ? 18 : 14)
    doc.setTextColor(50, 50, 50)
    doc.text(player.name, 72, yPos + 5)

    // Score
    doc.setFontSize(rank === 1 ? 18 : 14)
    doc.setTextColor(0, 200, 0)
    doc.text(`${player.score.toLocaleString()} point`, 190, yPos + 5, { align: 'right' })

    yPos += rank === 1 ? 40 : 32
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Genereret af CULTIQUIZ!!', 105, 290, { align: 'center' })

  // Download
  doc.save(`cultiquiz-resultater-${new Date().toISOString().split('T')[0]}.pdf`)
}
