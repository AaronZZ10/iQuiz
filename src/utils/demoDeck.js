// src/demoDeck.js
const demoDeck = [
  /* ========== SCIENCE (3) ========== */
  {
    question: "Which particle carries a negative electric charge?",
    answer: "Electron",
    choices: ["Proton", "Neutron", "Electron", "Positron"],
    explanation: "Electrons are negatively charged; protons are positive and neutrons are neutral.",
    tags: ["science"],
  },
  {
    question: "What is the primary gas in Earth’s atmosphere?",
    answer: "Nitrogen",
    choices: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"],
    explanation: "About 78% of the atmosphere is nitrogen.",
    tags: ["science"],
  },
  {
    question: "Which vitamin is primarily produced in the skin when exposed to sunlight?",
    answer: "Vitamin D",
    choices: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"],
    explanation: "UVB radiation helps the skin synthesize vitamin D.",
    tags: ["science"],
  },

  /* ========== GEOGRAPHY (3) ========== */
  {
    question: "What is the longest river in the world by length?",
    answer: "Nile",
    choices: ["Amazon", "Yangtze", "Mississippi–Missouri", "Nile"],
    explanation: "The Nile is commonly cited as the longest, with the Amazon a close contender.",
    tags: ["geography"],
  },
  {
    question: "Which country has the city of Marrakech?",
    answer: "Morocco",
    choices: ["Egypt", "Morocco", "Algeria", "Tunisia"],
    explanation: "Marrakech is a major city in western Morocco.",
    tags: ["geography"],
  },
  {
    question: "Mount Kilimanjaro is located in which country?",
    answer: "Tanzania",
    choices: ["Kenya", "Uganda", "Tanzania", "Ethiopia"],
    explanation: "Kilimanjaro sits in northeastern Tanzania near the Kenyan border.",
    tags: ["geography"],
  },

  /* ========== HISTORY (3) ========== */
  {
    question: "Who wrote the Declaration of Independence’s first draft?",
    answer: "Thomas Jefferson",
    choices: ["George Washington", "Thomas Jefferson", "John Adams", "Benjamin Franklin"],
    explanation: "Jefferson drafted it; Adams and Franklin made edits.",
    tags: ["history"],
  },
  {
    question: "The fall of the Berlin Wall occurred in which year?",
    answer: "1989",
    choices: ["1985", "1987", "1989", "1991"],
    explanation: "The wall opened on November 9, 1989.",
    tags: ["history"],
  },
  {
    question: "Which empire built the Colosseum?",
    answer: "Roman Empire",
    choices: ["Greek City-States", "Roman Empire", "Byzantine Empire", "Ottoman Empire"],
    explanation: "The Flavian dynasty of the Roman Empire completed it in 80 CE.",
    tags: ["history"],
  },

  /* ========== TECHNOLOGY (3) ========== */
  {
    question: "What does HTTP stand for?",
    answer: "HyperText Transfer Protocol",
    choices: [
      "Hyperlink Text Transfer Protocol",
      "HyperText Transfer Protocol",
      "High Throughput Transport Protocol",
      "Host Transport Text Protocol"
    ],
    explanation: "HTTP is the foundation of data communication for the web.",
    tags: ["technology"],
  },
  {
    question: "In computing, what does GPU primarily accelerate?",
    answer: "Parallel graphical computations",
    choices: [
      "Disk read/write operations",
      "Parallel graphical computations",
      "Network routing",
      "Power management"
    ],
    explanation: "GPUs are optimized for massively parallel workloads (graphics, ML).",
    tags: ["technology"],
  },
  {
    question: "Which company created the Android operating system?",
    answer: "Google",
    choices: ["Apple", "Nokia", "Microsoft", "Google"],
    explanation: "Android, Inc. was acquired by Google in 2005; Google leads its development.",
    tags: ["technology"],
  },

  /* ========== MATH (3) ========== */
  {
    question: "What is the value of π (pi) to two decimal places?",
    answer: "3.14",
    choices: ["3.12", "3.14", "3.16", "3.18"],
    explanation: "Pi is approximately 3.14159…",
    tags: ["math"],
  },
  {
    question: "Solve: 7 × 8 = ?",
    answer: "56",
    choices: ["48", "54", "56", "64"],
    explanation: "7 times 8 equals 56.",
    tags: ["math"],
  },
  {
    question: "Which of the following is a prime number?",
    answer: "29",
    choices: ["21", "27", "29", "33"],
    explanation: "29 has no positive divisors other than 1 and itself.",
    tags: ["math"],
  },

  /* ========== LITERATURE (3) ========== */
  {
    question: "Who wrote 'Pride and Prejudice'?",
    answer: "Jane Austen",
    choices: ["Charlotte Brontë", "Jane Austen", "Mary Shelley", "Emily Dickinson"],
    explanation: "Published in 1813, it’s one of Austen’s most famous works.",
    tags: ["literature"],
  },
  {
    question: "‘To be, or not to be’ is from which Shakespeare play?",
    answer: "Hamlet",
    choices: ["Macbeth", "Hamlet", "Othello", "King Lear"],
    explanation: "The famous soliloquy appears in Act 3, Scene 1 of Hamlet.",
    tags: ["literature"],
  },
  {
    question: "George Orwell’s 'Animal Farm' is best described as a:",
    answer: "Political satire/allegory",
    choices: ["Romantic epic", "Political satire/allegory", "Science textbook", "Travelogue"],
    explanation: "It allegorizes events leading up to the Russian Revolution and after.",
    tags: ["literature"],
  },

  /* ========== ART (3) ========== */
  {
    question: "Who painted the Mona Lisa?",
    answer: "Leonardo da Vinci",
    choices: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Caravaggio"],
    explanation: "Housed in the Louvre Museum in Paris.",
    tags: ["art"],
  },
  {
    question: "Cubism is most associated with which artist?",
    answer: "Pablo Picasso",
    choices: ["Claude Monet", "Pablo Picasso", "Salvador Dalí", "Frida Kahlo"],
    explanation: "Picasso and Braque pioneered Cubism in the early 20th century.",
    tags: ["art"],
  },
  {
    question: "Which movement is Claude Monet linked to?",
    answer: "Impressionism",
    choices: ["Impressionism", "Surrealism", "Baroque", "Dada"],
    explanation: "Monet’s work epitomizes Impressionist techniques.",
    tags: ["art"],
  },

  /* ========== SPORTS (3) ========== */
  {
    question: "How many players are on the field per team in soccer (association football)?",
    answer: "11",
    choices: ["9", "10", "11", "12"],
    explanation: "A full side has 11 players on the pitch.",
    tags: ["sports"],
  },
  {
    question: "In tennis, what is the term for a score of zero?",
    answer: "Love",
    choices: ["Nil", "Blank", "Love", "Zero"],
    explanation: "‘Love’ denotes zero points in tennis scoring.",
    tags: ["sports"],
  },
  {
    question: "Which country traditionally wins the most medals at the Winter Olympics?",
    answer: "Norway",
    choices: ["Canada", "United States", "Germany", "Norway"],
    explanation: "Norway consistently tops Winter Olympic medal tables historically.",
    tags: ["sports"],
  },

  /* ========== ECONOMICS (3) ========== */
  {
    question: "What term describes a general rise in prices over time?",
    answer: "Inflation",
    choices: ["Deflation", "Inflation", "Stagflation", "Disinflation"],
    explanation: "Inflation reduces purchasing power as average prices increase.",
    tags: ["economics"],
  },
  {
    question: "GDP stands for:",
    answer: "Gross Domestic Product",
    choices: [
      "Gross Domestic Product",
      "General Development Plan",
      "Global Demand Pricing",
      "Gross Demographic Profile"
    ],
    explanation: "GDP measures the monetary value of final goods and services produced domestically.",
    tags: ["economics"],
  },
  {
    question: "A market with many sellers offering slightly differentiated products is:",
    answer: "Monopolistic competition",
    choices: [
      "Perfect competition",
      "Monopolistic competition",
      "Oligopoly",
      "Monopoly"
    ],
    explanation: "Monopolistic competition features differentiation and many firms.",
    tags: ["economics"],
  },

  /* ========== HEALTH (3) ========== */
  {
    question: "Which organ is primarily responsible for filtering blood to form urine?",
    answer: "Kidneys",
    choices: ["Liver", "Kidneys", "Pancreas", "Spleen"],
    explanation: "The kidneys filter waste products and excess fluid.",
    tags: ["health"],
  },
  {
    question: "What macronutrient is the body’s most immediate source of energy?",
    answer: "Carbohydrates",
    choices: ["Proteins", "Fats", "Carbohydrates", "Fiber"],
    explanation: "Carbohydrates break down into glucose for quick energy.",
    tags: ["health"],
  },
  {
    question: "Which of the following is a cardio-protective lifestyle habit?",
    answer: "Regular aerobic exercise",
    choices: [
      "High trans-fat diet",
      "Regular aerobic exercise",
      "Chronic sleep deprivation",
      "Sedentary behavior"
    ],
    explanation: "Routine aerobic activity improves cardiovascular health.",
    tags: ["health"],
  },
];

export default demoDeck;