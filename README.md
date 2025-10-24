# Quizzer

**Quizzer** is a smart, lightweight web app for reviewing study materials and generating quizzes. You can upload your own questions in JSON/CSV format or import class slides (PDF), and Quizzer will automatically generate quiz questions using the OpenAI API.

---

## 🚀 Features

- **AI Quiz Generation:** Upload PDF slides and have questions automatically generated with ChatGPT.
- **Multiple Modes:** Switch between Quiz, Short Answer, and Flashcard modes.
- **Progress Tracking:** Automatically saves your selected answers and restores them later.
- **Flagging System:** Mark questions to review later or focus on flagged ones only.
- **Question Jump Bar:** Easily navigate between questions, with active and flagged questions highlighted.
- **Keyboard Navigation:** Use the ← and → arrow keys to move between questions.
- **Download Deck:** Export your entire deck (or generated questions) to JSON.
- **Responsive Design:** Works well on desktops and tablets with TailwindCSS.

---

## 🧩 Tech Stack

- **Frontend:** React + TailwindCSS
- **Backend:** Node.js + Express
- **AI Integration:** OpenAI API
- **PDF Parsing:** `pdfjs-dist` for client-side text extraction
- **Data Persistence:** In-memory JSON deck, export/import support

---

## 📦 Installation

```bash
# Clone this repository
git clone https://github.com/yourusername/quizzer.git
cd quizzer

# Install dependencies
npm install

# Start the React frontend
npm start
```

In another terminal:

```bash
# Move to the server directory
cd server

# Install backend dependencies
npm install

# Start the backend API server
npm run start
```

By default, the backend runs at **http://localhost:5050** and the frontend at **http://localhost:3000**.

---

## 🧠 Usage

1. **Load Questions**
   - Upload a `.json` or `.csv` file containing your quiz deck.
   - Or upload a `.pdf` slide deck to generate questions automatically with ChatGPT.

2. **Choose a Mode**
   - **Quiz:** Multiple-choice questions with instant feedback.
   - **Short Answer:** Type your answer and check correctness.
   - **Flashcard:** Simple front/back mode for rapid review.

3. **Navigate & Review**
   - Use the **Previous** and **Next** buttons, or ← / → keys.
   - Use the **Jump Bar** to move to any question.
   - Flag difficult questions and optionally review flagged only.

4. **Save or Export**
   - Download all questions in JSON format for backup or reuse.

---

## 🗂 JSON Format Example

Here’s the expected structure for your JSON file:

```json
{
  "items": [
    {
      "question": "What does REST stand for?",
      "answer": "Representational State Transfer",
      "choices": ["Random", "Representational State Transfer", "Stateful"],
      "explanation": "An architectural style for web APIs.",
      "tags": ["web", "apis"]
    }
  ]
}
```

You can also load a plain array of question objects without the `items` wrapper.

---

## ⚙️ Environment Setup

Create a `.env` file in your `/server` directory with your OpenAI API key:

```bash
OPENAI_API_KEY=your_api_key_here
PORT=5050
```

---

## 🧩 Developer Notes

- The app uses `compression` middleware for faster JSON responses.
- Large decks are auto-windowed in the jump bar to avoid performance drops.
- Keyboard and scroll behavior are synchronized to keep the active question visible.

---

## 💡 Future Improvements

- Persistent user progress with localStorage
- Question categories and timed quiz mode
- Import/export to Google Drive
- Cloud deployment on AWS or Vercel

---

## 🧑‍💻 Author

**Hao Liu**  
Senior Computer Science Student @ Texas A&M University  
Passionate about AI, data visualization, and educational tech tools.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---
