# iQuiz

iQuiz is a web-based intelligent quiz generator and reviewer built with React, TailwindCSS, and Node.js.  
It allows users to upload their study materials (JSON, CSV, or PDF slides) and automatically generate review questions using OpenAI models.

🌐 **Live Demo:** [https://iquiz-oz01.onrender.com](https://iquiz-oz01.onrender.com)

## 🚀 Features

- **Upload PDF, JSON, or CSV:** Load class slides or question sets directly.
- **Automatic Quiz Generation:** Uses OpenAI API to generate questions and answers from your slides.
- **Model Selection:** Choose between different GPT models for question generation.
- **Target Question Count:** Specify how many questions to generate.
- **Quiz Modes:**
  - **Multiple-choice**
  - **Short-answer**
  - **Flashcard review**
- **Flag & Review:** Mark questions to revisit and review flagged ones later.
- **Keyboard Navigation:** Use ← and → arrows to move between questions.
- **Download / Upload Decks:** Save generated quizzes in JSON format or reupload them later.
- **Real-time Streaming:** Questions load incrementally as OpenAI streams results.
- **Responsive UI:** Built with TailwindCSS for a clean, adaptive design.
- **Help Window:** Displays usage instructions and tips in an accessible popup.

## 🧩 Tech Stack

- **Frontend:** React, TailwindCSS
- **Backend:** Node.js + Express
- **AI Integration:** OpenAI API (streaming responses)
- **PDF Parsing:** pdf.js
- **Deployment:** AWS (recommended setup for production)

## ⚙️ Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/iQuiz.git
   cd iQuiz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend:
   ```bash
   cd server
   node index.js
   ```

4. Start the frontend:
   ```bash
   cd ..
   npm start
   ```

## 🧠 Usage

1. Open `http://localhost:3000`.
2. Upload your slides or JSON question deck.
3. Choose a GPT model and (optionally) target number of questions.
4. Watch as iQuiz generates questions in real-time.
5. Review, flag, and retake quizzes in different modes.

## 📦 Folder Structure
```
/server
  index.js             # Express + OpenAI backend
/src
  /components          # React UI components (Header, ControlsBar, etc.)
  QuizApp.js           # Main quiz logic
  index.js, index.css  # React entry points
```

## 📄 License
MIT License.