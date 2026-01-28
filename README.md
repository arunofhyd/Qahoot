# Qahoot

**Qahoot** is a dynamic and interactive real-time quiz web application designed to bring the fun and engagement of popular quiz platforms like Kahoot! to your browser. Built with a focus on a modern, beautiful aesthetic and robust real-time synchronization, Qahoot provides a seamless experience for both hosts and players across all devices.

## ✨ Features

### 🎨 Design & Aesthetic

* **Modern Theme:** A visually striking design featuring deep blue, dark grey/black backgrounds, complemented by vibrant accent blues for interactive elements.

* **Frosted Glass Effect:** Key UI elements like cards, modals, and leaderboards leverage a sophisticated frosted glass appearance using `backdrop-filter: blur()`, creating a professional and inviting look.

* **Fully Responsive:** Crafted with Tailwind CSS, the application adapts beautifully to all screen sizes and orientations (mobile, tablet, desktop) ensuring an optimal user experience without horizontal scrolling.

### 👥 User Roles

#### Host Features:

* **Secure Authentication:** Dedicated login for hosts using email and password to access quiz creation and hosting functionalities.

* **Quiz Creation & Management:**

    * Intuitive interface to create multiple-choice quizzes.

    * Define question text, four answer options, and a single correct answer for each question.

    * Set custom time limits (10, 20, 30, 45, 60 seconds) per question.

    * Save, load, and edit quizzes for future sessions.

* **Real-time Hosting Control Panel:**

    * Generate a unique **Room Code** for players to join.

    * Monitor a real-time lobby displaying all connected players.

    * Control the quiz flow with "Start Quiz", "Next Question", "Skip Question" buttons.

    * **"Change Question" Functionality:** Dynamically switch to any question in the quiz mid-session, ensuring smooth transitions.

    * "End Quiz" button to gracefully conclude the session.

    * Host's screen displays the current question, active timer, and access to real-time leaderboards.

#### Player Features:

* **Easy Joining:** Join a quiz session directly from the homepage by entering a unique Room Code.

* **Nickname Input:** Enter a nickname upon successful room code validation.

* **Real-time Lobby:** See other joined players in the waiting room, synchronized across all participants.

* **Interactive Quiz Play:**

    * Questions and answer choices appear instantly as the host advances.

    * Immediate visual feedback (correct/incorrect) after answer submission.

    * A prominent, real-time question timer.

* **Dynamic Leaderboards:**

    * **Round Leaderboard:** A visually striking, real-time leaderboard displayed briefly after *each question*, showing per-round scores and rank changes with frosted glass styling.

    * **Overall Leaderboard:** A comprehensive final leaderboard at the end of the quiz, presenting total scores and final rankings, also styled with the frosted glass theme.

## 🚀 Tech Stack

Qahoot is built with an **awesome React.js frontend** for a performant and engaging user experience, powered by a robust Firebase backend.

* **Frontend:**

    * **React.js:** Functional components, Hooks for state management and side effects.

    * **Tailwind CSS:** Utility-first CSS framework for rapid and responsive styling, meticulously crafted to achieve the specified design theme.

    * **React Router DOM:** For seamless navigation and routing within the Single Page Application.

* **Backend & Database:**

    * **Firebase Authentication:** Secure email/password login for hosts and user identification for players.

    * **Cloud Firestore:** A NoSQL cloud database providing real-time data synchronization for quiz states, player lists, scores, and game flow.

* **Deployment:**

    * **Netlify:** For continuous deployment and static site hosting.

## ⚙️ Getting Started

Follow these steps to set up and run Qahoot locally.

### Prerequisites

* Node.js (LTS version recommended)

* npm or yarn

* A Firebase project

### Firebase Project Setup

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.

2.  **Enable Firestore Database:** In your Firebase project, navigate to "Firestore Database" and click "Create database." Choose "Start in production mode."

3.  **Enable Authentication:** Go to "Authentication" and enable the "Email/Password" provider.

4.  **Register a Web App:** In your Project settings (gear icon next to "Project Overview"), click "Add app" and select the web icon (`</>`). Follow the steps to register your web app and obtain your Firebase configuration object.

5.  **Firebase Security Rules:**

    * Copy the Firestore security rules provided in the project documentation (or previous response) and paste them into your Firebase project's Firestore "Rules" tab. **Remember to update the `isAdmin()` function with your actual host email for production.**

### Installation

1.  **Clone the repository:**

    ```
    git clone [https://github.com/your-username/qahoot.git](https://github.com/your-username/qahoot.git)
    cd qahoot
    ```

2.  **Install dependencies:**

    ```
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the project (`qahoot/.env`) and add your Firebase configuration details:

    ```
    REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
    REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
    # REACT_APP_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID # Optional
    ```

    Replace `YOUR_API_KEY`, etc., with the values from your Firebase web app configuration.

### Running the App Locally

Start the development server:
npm start
or
yarn start

The application will open in your browser at `http://localhost:3000`.

## 🚀 Deployment

This application is designed for easy deployment to Netlify.

1.  **Connect to Netlify:**

    * Log in to your [Netlify account](https://app.netlify.com/).

    * Click "Add new site" -> "Import an existing project" -> "Deploy with GitHub".

    * Select your `qahoot` repository.

2.  **Configure Build Settings:**

    * **Build command:** `npm run build`

    * **Publish directory:** `build`

3.  **Set Environment Variables:**

    * Before deploying, go to "Site settings" -> "Build & deploy" -> "Environment variables" in your Netlify site dashboard.

    * Add all the `REACT_APP_FIREBASE_...` variables from your `.env` file here.

4.  **Deploy:** Click "Deploy site". Netlify will automatically build and deploy your application.

## 🎮 Usage

### For Hosts:

1.  Navigate to `/admin/login`.

2.  Log in with your host credentials.

3.  From the Host Dashboard, you can:

    * **Create New Quiz:** Design your quiz questions, answer options, and time limits.

    * **Host Quiz:** Select a saved quiz to generate a unique Room Code. Share this code with players.

    * Manage the live quiz session, control question flow, and monitor player progress.

### For Players:

1.  Go to the homepage (`/`).

2.  Enter the Room Code provided by the host.

3.  Enter a unique nickname to join the lobby.

4.  Participate in the live quiz, submit answers, and see real-time feedback and leaderboards.

## ✅ Robustness & Error Handling

Qahoot is built with comprehensive error handling across all Firebase operations and user interactions. The application provides clear, user-friendly feedback instead of crashes, ensuring a stable and reliable experience. Real-time synchronization is meticulously managed to minimize latency and ensure data consistency across all connected clients.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the app, please feel free to open an issue or submit a pull request.
