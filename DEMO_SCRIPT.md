# Physical List Activity – System Presentation & Demo Script

**Project Title:** Physical List Activity (Fitness & Habit Tracker)  
**Presenter(s):** Development Team  
**Target Duration:** ~5 - 7 Minutes  
**Key Highlights:** Activity Lifecycle (CRUD), Live Stopwatch/Timer, Real-time Charts & Analytics, Profile & Avatar Customization, Offline-First Architecture & Supabase Cloud Synchronization.

---

## 🎙️ Section 1: Introduction & Hook (1 Minute)

### **[Screen: Welcome Screen / Splash Banner]**

**Speaker Notes:**
> "Good day everyone! Today, our team is thrilled to present **Physical List Activity**—a mobile-responsive fitness and wellness tracker designed to make staying active effortless, motivating, and beautifully visual.
>
> Many people struggle to keep up with their fitness routines because traditional fitness apps are either bloated with paywalls or lack clean offline functionality.
>
> Our app solves this by providing:
> 1. A clean, intuitive mobile card interface with status tracking.
> 2. An interactive live workout stopwatch with real-time lap counting and celebrations.
> 3. Dynamic visual statistics and category distributions.
> 4. An offline-first architecture with instant Supabase cloud synchronization."

---

## 🏃 Section 2: Home Screen & Quick Overview (1.5 Minutes)

### **[Screen: Home Dashboard]**

**Action:** Show the Home Screen on the mobile frame. Point out the Date Header, Streak Badge, Daily Goal Progress bar, and Today's Highlights.

**Speaker Notes:**
> "Here on the **Home Dashboard**, the user is greeted with their active streak count, today's goal progress, and quick action cards.
>
> In the top summary, you can see total minutes logged, completed workouts, and remaining goal time. 
>
> Right below, the **Today's Highlights** carousel surfaces items scheduled for today with quick status tags:
> - **Green** for Completed
> - **Amber** for Ongoing
> - **Slate** for Not Started"

**Action:** Click the play button or start button on any activity to showcase the **Live Workout Mode**.

---

## ⏱️ Section 3: Live Workout Mode & Mini-Timer (1.5 Minutes)

### **[Screen: Active Workout Modal & Floating Mini Timer]**

**Action:**
1. Start a workout session.
2. Demonstrate the live stopwatch with seconds ticking.
3. Tap **Record Lap / Split** to show multi-split recording.
4. Minimize the timer to demonstrate the **Floating Mini-Timer** that stays on screen while browsing activities!
5. Re-expand and tap **Finish Workout**.

**Speaker Notes:**
> "One of our standout features is the **Live Workout Mode**:
> - Users can start a real-time session with an interactive stopwatch.
> - They can record split times or pause whenever they take a rest.
> - Even better: if they want to browse other activities or check statistics, they can minimize the modal into a **floating mini-timer** docked at the bottom right.
> - When finished, tapping 'Finish Workout' automatically marks the activity as Completed and triggers celebratory confetti!"

---

## 📋 Section 4: Activities List, Search, Filter & Editing (1.5 Minutes)

### **[Screen: My Activities Screen]**

**Action:**
1. Tap the **Activities** tab in the bottom navigation.
2. Demonstrate the quick search bar (type "Run" or "Yoga").
3. Filter by category (Cardio, Strength, Flexibility) or by status (Completed, Ongoing, Not Started).
4. Tap **+ (Add Activity)** to show the quick modal, add a new activity (e.g. 'Evening Walk', 25 mins).
5. Open an activity detail card, show editing duration or status.

**Speaker Notes:**
> "Under **Activities**, users have complete control:
> - Fast client-side search by activity name and notes.
> - Filter chips to isolate categories like Cardio or Strength, or filter by completion status.
> - Creating a new activity takes just seconds: enter name, category, target duration, and date.
> - Every activity supports full editing, status updating, or deletion with confirmation safeguards."

---

## 📊 Section 5: Statistics & Insights (1 Minute)

### **[Screen: Statistics Screen]**

**Action:** Tap the **Stats** tab in the bottom navigation.

**Speaker Notes:**
> "The **Statistics Screen** provides immediate visual feedback:
> - A dynamic bar chart showing activity minutes over the last 7 days.
> - Category breakdowns displaying where the user spends their time—cardio, strength training, or recovery.
> - Key performance metrics including average daily duration, total activities, and completion rate."

---

## 👤 Section 6: User Profile, Custom Avatars & Settings (1 Minute)

### **[Screen: Profile Screen]**

**Action:**
1. Tap the **Profile** tab.
2. Tap on the user avatar to open the **Edit Profile Modal**.
3. Choose a custom preset avatar (Athlete, Runner, Zen, Cyclist) OR upload a custom profile photo!
4. Adjust the daily goal target slider (e.g., from 60 mins to 75 mins).
5. Tap **Save Profile**. Show instant update on the UI.
6. Toggle Dark Mode in Settings.

**Speaker Notes:**
> "In the **Profile Screen**, users can personalize their experience:
> - Tap the profile photo to customize their avatar. They can choose from expressive preset fitness avatars or upload their own image directly from their device.
> - Customize display name, title, and adjust their daily target minutes using the goal controls.
> - Full Dark Mode and Light Mode support with smooth transition colors."

---

## ☁️ Section 7: Supabase Cloud Sync & Offline-First Design (1 Minute)

### **[Screen: Supabase Cloud Sync Modal]**

**Action:** Tap the Cloud Database icon on the top bar or inside Profile.

**Speaker Notes:**
> "Under the hood, **Physical List Activity** is built with a resilient, offline-first architecture:
> - If an internet connection or Supabase database is active, changes seamlessly sync with PostgreSQL on Supabase via RESTful APIs.
> - If the user is offline or traveling, the application continues to work without interruption using local persistence and cached storage.
> - When reconnected, data syncs automatically."

---

## 🎯 Section 8: Conclusion & Q&A

**Speaker Notes:**
> "To summarize, **Physical List Activity** combines the best of mobile fitness tracking—live stopwatch utilities, rich analytics, customizable profiles, and reliable offline-first cloud syncing—into a sleek, responsive interface.
>
> Thank you very much! We now welcome any questions or feedback from the panel."

---

### 💡 Quick Q&A Preparation Sheet

- **Q: What happens if there's no internet connection?**  
  *A:* The app runs 100% locally with localStorage and in-memory caches. Workouts, timers, profiles, and statistics remain fully functional.

- **Q: Can users upload their own custom pictures?**  
  *A:* Yes! The profile screen allows either uploading an image from the device or selecting one of the curated sport avatar badges.

- **Q: What technology stack is used?**  
  *A:* React 19, TypeScript, Tailwind CSS, Lucide icons, Express/Node.js backend, and Supabase / PostgreSQL.
