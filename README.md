# iQuiz

iQuiz is a web-based intelligent quiz generator and reviewer built with React, TailwindCSS, and Node.js.  
It allows users to upload their study materials (JSON, CSV, or PDF slides) and automatically generate review questions using AI models.  
The **Express backend uses Google Gemini**, while the **Spring Boot backend uses OpenAI**.

| Backend | Model | Live Demo | Server Health Check |
|----------|--------|------------|---------------|
| Express.js | Gemini | [Link](https://iquiz-1.onrender.com) | [Check](https://iquiz-oz01.onrender.com/health) |
| Spring Boot | OpenAI | [Link](https://iquiz-spring.onrender.com) | [Check](https://iquiz-server-spring.onrender.com) |

## 🚀 Features

- **Upload PDF:** Load class slides or question sets directly.
- **Automatic Quiz Generation:** Uses Google Gemini API (Express) or OpenAI API (Spring Boot) to generate questions and answers from your slides.
- **Model Selection:** Choose between different GPT models for question generation.
- **Target Question Count:** Specify how many questions to generate.
- **Quiz Modes:**
  - **Multiple-choice**
  - **Short-answer**
  - **Flashcard review**
- **Flag & Review:** Mark questions to revisit and review flagged ones later.
- **Keyboard Navigation:** Use ← and → arrows to move between questions.
- **Download / Upload Decks:** Save generated quizzes in JSON format or reupload them later.
- **Real-time Streaming:** Questions load incrementally as AI streams results.
- **Responsive UI:** Built with TailwindCSS for a clean, adaptive design.
- **Help Window:** Displays usage instructions and tips in an accessible popup.
- **Backend Options:** Supports two backend servers for quiz generation:
  - **Node.js + Express** server using **Google Gemini API**, deployed on Render.
  - **Spring Boot (Java)** server using **OpenAI API**, deployed on Render.
- Users can switch between these backend servers for generating quizzes.

## 🧩 Tech Stack

- **Frontend:** React, TailwindCSS
- **Backend:** Node.js + Express with Google Gemini API **and** Spring Boot (Java) with OpenAI API on Render
- **AI Integration:** Google Gemini API (Express) and OpenAI API (Spring Boot)
- **PDF Parsing:** pdf.js
- **Deployment:** Render

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

3. Start the backend server of your choice with AI integration:

   - For **Node.js + Express** backend using **Google Gemini API**:

     ```bash
     cd server
     node index.js
     ```

   - For **Spring Boot (Java)** backend using **OpenAI API**:

     The Spring Boot server is deployed and accessible at:  
     `https://your-spring-boot-server.onrender.com`

4. Start the frontend:
   ```bash
   cd ..
   npm start
   ```

**Note:** The frontend can be configured to connect to either AI-powered backend server depending on your preference.

## 🧠 Usage

1. Open `http://localhost:3000`.
2. Upload your slides or JSON question deck.
3. Choose a GPT model and (optionally) target number of questions.
4. Select which backend server to use for quiz generation (Node.js with Google Gemini or Spring Boot with OpenAI).
5. Watch as iQuiz generates questions in real-time.
6. Review, flag, and retake quizzes in different modes.

## 📦 Folder Structure

```
/server
  index.js             # Node.js + Express backend
/src
  /components          # React UI components (Header, ControlsBar, etc.)
  QuizApp.js           # Main quiz logic
  index.js, index.css  # React entry points
```

## 📄 License

MIT License.
