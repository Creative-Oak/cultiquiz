export interface Question {
  question: string
  options: [string, string, string, string]
  correct: 'A' | 'B' | 'C' | 'D'
  image?: string  // Optional image URL
}

// CULTIQUIZ!! Questions
export const questions: Question[] = [
  // ============================================
  // RUNDE 1: Pop & Trends
  // ============================================
  {
    question: "Hvem er mest streamet på Spotify i 2026?",
    options: ["Ed Sheeran", "Taylor Swift", "Bad Bunny", "The Weeknd"],
    correct: "B"
  },
  {
    question: "Hvem er denne baryl?",
    options: ["Marius Borg Høiby", "Søren Sko", "Thue Thesbjerg", "Kronprinsen"],
    correct: "A",
    image: "https://www.dr.dk/images/crop/2025/06/27/1751030771_scanpix-20250627-125614-l.jpg"
  },
  {
    question: "Hvilken storfilm dominerer biograferne i 2026?",
    options: ["Avatar 3: Fire & Ash", "Shrek 5", "Barbie 2", "Star Wars X"],
    correct: "A"
  },
  {
    question: "Hvilket medie bruges som søgemaskine i 2026?",
    options: ["Facebook", "LinkedIn", "TikTok", "BeReal"],
    correct: "C"
  },
  {
    question: "Hvilken dansk artist har vundet flest DMA priser?",
    options: ["Kim Larsen", "Tobias Rahim", "Guldimund", "Lukas Graham"],
    correct: "B"
  },

  // ============================================
  // RUNDE 2: Videnskab
  // ============================================
  {
    question: "Hvad er Skotlands officielle nationaldyr?",
    options: ["En Loch Ness-uhyre", "En enhjørning", "En gylden ørn", "En highland-ko"],
    correct: "B"
  },
  {
    question: "Hvor mange hjerter har en blæksprutte?",
    options: ["1", "2", "3", "8"],
    correct: "C"
  },
  {
    question: "Hvilken farve er en isbjørns hud?",
    options: ["Hvid", "Lyserød", "Sort", "Grå"],
    correct: "C"
  },
  {
    question: "Hvad kan ses fra rummet med det blotte øje?",
    options: ["Den Kinesiske Mur", "Pyramiderne i Giza", "Vejle Fjord Broen", "Storebæltsbroen"],
    correct: "B",
    image: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRz2dkmCcGwd41WHnWcnujTy5am7Tw2P0O3lMaLPJQS2EyIWZ-0KNUFYPMAJ5Fu"
  },
  {
    question: "Hvor lang tid tog verdens korteste krig?",
    options: ["38 minutter", "2 timer", "12 dage", "4 måneder"],
    correct: "A"
  },

  // ============================================
  // RUNDE 3: Logik
  // ============================================
  {
    question: "Hvor mange måneder har 28 dage i sig?",
    options: ["Kun 1 (februar)", "6", "12", "Det skifter"],
    correct: "C"
  },
  {
    question: "Hvilket land har flest øer i verden?",
    options: ["Grækenland", "Indonesien", "Sverige", "Filippinerne"],
    correct: "C"
  },
  {
    question: "Hvad blev Amazon oprindeligt kaldt?",
    options: ["Cadabra", "BookStore", "EverythingStore", "Nile"],
    correct: "A"
  },
  {
    question: "Hvor mange tidszoner findes der i Rusland?",
    options: ["3", "7", "11", "24"],
    correct: "C"
  },
  {
    question: "Hvad sker der hvis man søger på \"askew\" på Google?",
    options: ["Det sner", "Skærmen drejer", "Den bliver skæv", "Viser katte"],
    correct: "C"
  }
]

export function getQuestionForIndex(index: number): Question | null {
  if (index < 0 || index >= questions.length) return null
  return questions[index]
}

export function getRoundForQuestion(questionIndex: number): number {
  return Math.floor(questionIndex / 5) + 1
}

export function isLastQuestionOfRound(questionIndex: number): boolean {
  return (questionIndex + 1) % 5 === 0
}

export function isLastQuestion(questionIndex: number): boolean {
  return questionIndex === questions.length - 1
}

export const TOTAL_QUESTIONS = questions.length
export const QUESTIONS_PER_ROUND = 5
export const TOTAL_ROUNDS = 3
