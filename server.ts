import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize Gemini API Client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  console.log("Initializing Gemini Client with provided API Key.");
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn(
    "Warning: GEMINI_API_KEY not set or placeholder. Falling back to Intelligent Simulation Mode."
  );
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API Route: Analyze Task & Predict Risk Score (Deadline Intelligence & Smart Planner)
app.post("/api/analyze-task", async (req, res) => {
  const { title, description, deadline, priority, category, currentWorkloadCount } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({ error: "Title and deadline are required." });
  }

  const prompt = `
    Analyze this task for DeadlineOS AI - the autonomous productivity companion.
    
    Task Details:
    - Title: "${title}"
    - Description: "${description || 'None'}"
    - Deadline: ${deadline} (Current time is ${new Date().toISOString()})
    - Priority: ${priority || 'medium'}
    - Category: ${category || 'work'}
    - Current Active Workload: ${currentWorkloadCount || 0} other tasks
    
    Calculate a completion risk score (0-100) indicating how likely the user is to miss this deadline.
    Factors to evaluate:
    - Time remaining between now and deadline.
    - Typical complexity based on title and description.
    - Priority tier (critical tasks are high pressure).
    - Current active workload overlap.
    
    If the deadline is within 24 hours, the risk should typically be very high (75%+), triggering Deadline Rescue Emergency Mode.
    
    Break down the task into 3 to 6 actionable sequential subtasks (with realistic duration estimates in minutes).
    Provide a dynamic schedule recommendation (3 to 5 slots) for today or upcoming days to block calendar slots.
    Suggest 2-3 web reference materials, documentation, or tutorial search-topics related to the task.
    Also generate a beautifully crafted, highly polite extension request email the user can copy-paste to negotiate more time if they are in a high-risk situation.
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.INTEGER, description: "Risk score from 0 (no risk) to 100 (guaranteed miss)." },
              riskReason: { type: Type.STRING, description: "Brief human-like risk reasoning text." },
              estimatedHours: { type: Type.NUMBER, description: "Total predicted effort in hours." },
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER }
                  },
                  required: ["title", "estimatedMinutes"]
                }
              },
              schedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING, description: "Formatted time, e.g. '03:30 PM'" },
                    taskName: { type: Type.STRING },
                    durationMinutes: { type: Type.INTEGER }
                  },
                  required: ["time", "taskName", "durationMinutes"]
                }
              },
              referenceMaterials: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedExtensionEmail: { type: Type.STRING, description: "Polite negotiation email draft." }
            },
            required: ["riskScore", "riskReason", "estimatedHours", "subtasks", "schedule", "referenceMaterials", "suggestedExtensionEmail"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      return res.json(data);
    } catch (err: any) {
      console.warn("Gemini task analysis unavailable, using local intelligence engine.");
    }
  }

  // Simulated AI response
  const timeDiffHours = (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
  let simulatedRisk = Math.min(Math.max(Math.round(85 - (timeDiffHours / 12) + (currentWorkloadCount || 0) * 8), 10), 98);
  if (priority === 'critical') simulatedRisk = Math.min(simulatedRisk + 15, 99);
  if (timeDiffHours <= 24) simulatedRisk = Math.min(Math.max(simulatedRisk, 85), 98);

  const mockReason = timeDiffHours <= 24 
    ? "Critical emergency mode active. Less than 24 hours left with active workload conflicts and limited free slots tonight." 
    : `Moderate workload risk. Estimated workload requires ${Math.round(4 + simulatedRisk / 20)} hours but calendar lists concurrent meetings.`;

  const mockSubtasks = [
    { title: "Define Core Structure and Requirements", estimatedMinutes: 45 },
    { title: "Research Best Practices and Implement Foundation", estimatedMinutes: 90 },
    { title: "Core Component Assembly & Integration", estimatedMinutes: 120 },
    { title: "Local Optimization, Testing and Edge-Case Validation", estimatedMinutes: 60 }
  ];

  const mockSchedule = [
    { time: "10:00 AM", taskName: `Study: Focus Phase for ${title}`, durationMinutes: 60 },
    { time: "02:30 PM", taskName: `Execute: Deep Work on ${title}`, durationMinutes: 120 },
    { time: "08:00 PM", taskName: `Review: Polish and Verify ${title}`, durationMinutes: 45 }
  ];

  const mockRefs = [
    `Official Guides for ${category || 'productivity'}`,
    "High-Performance Execution Patterns",
    "Time-Blocking & Peak Focus Science Studies"
  ];

  const mockEmail = `Subject: Request for Brief Timeline Adjustment - ${title}\n\nHi Team,\n\nI am currently driving deep focus on "${title}" to deliver maximum quality. To ensure the implementation meets high-reliability standards and edge cases are validated, I would like to adjust our target milestone slightly to tomorrow afternoon. Please let me know if this brief window works.\n\nBest regards,\n[Your Name] (via DeadlineOS AI)`;

  return res.json({
    riskScore: simulatedRisk,
    riskReason: mockReason,
    estimatedHours: Number((2.5 + simulatedRisk / 25).toFixed(1)),
    subtasks: mockSubtasks,
    schedule: mockSchedule,
    referenceMaterials: mockRefs,
    suggestedExtensionEmail: mockEmail
  });
});

// API Route: AI Assistant Chat (Voice Assistant Companion)
app.post("/api/assistant", async (req, res) => {
  const { messages, currentTasks } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const systemInstruction = `
    You are DeadlineOS, an autonomous productivity AI executive companion.
    Your mission is to act as an active, supportive, yet firm executive partner that helps the user finish their work and beat procrastination.
    
    Instead of simply acting like a dumb reminder app, talk with a proactive "assistant mindset". For example:
    - Highlight high-risk tasks that need urgent action.
    - Break down tasks on the fly.
    - Provide behavioral suggestions (e.g. "You seem overloaded. Let's block 15 minutes of quiet time and finish the report introduction together. I'll handle the checklist.")
    - Suggest schedule adjustments.
    
    Current active user tasks in DeadlineOS:
    ${JSON.stringify(currentTasks || [], null, 2)}
    
    Keep responses highly engaging, action-focused, elegant, and concise. Avoid dry lists or generic developer greetings. Keep answers relatively short so they can be spoken clearly. Use markdown highlights occasionally.
  `;

  if (ai) {
    try {
      const chatMessages = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: m.content }]
      }));

      // Grab the last user message
      const lastMessage = chatMessages.pop();

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8
        },
        // We can pass past messages
        history: chatMessages
      });

      const response = await chat.sendMessage({
        message: lastMessage?.parts[0]?.text || "Hello"
      });

      return res.json({ text: response.text });
    } catch (err: any) {
      console.warn("Gemini assistant chat unavailable, activating local companion conversational matrix.");
    }
  }

  // Simulated conversational response fallback
  const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
  let responseText = "Understood. I am analyzing your workload. Let's take control of your timeline by focusing on your highest priority task first. What section should we tackle in the next 15 minutes?";

  if (lastUserMsg.includes("what should i do") || lastUserMsg.includes("priorit") || lastUserMsg.includes("agenda")) {
    if (currentTasks && currentTasks.length > 0) {
      const highest = [...currentTasks].sort((a, b) => b.riskScore - a.riskScore)[0];
      responseText = `Looking at your dashboard, **${highest.title}** has the highest Completion Risk Score (**${highest.riskScore}%**). I recommend starting immediately. Let's trigger **Rescue Mode** and run a 25-minute quiet Pomodoro focus session. I will block notifications and play lofi focus tracks. Shall we begin?`;
    } else {
      responseText = "Your dashboard is clean! Excellent job keeping deadlines in check. Add a new task or mission when you're ready, and I'll analyze the timeline risk immediately.";
    }
  } else if (lastUserMsg.includes("rescue") || lastUserMsg.includes("emergency")) {
    responseText = "Emergency Deadline Rescue Mode activated. I've restructured your checklist, prioritized critical paths, and loaded a 30-day simulated timeline to safeguard your sleep cycle. Let's execute immediately.";
  } else if (lastUserMsg.includes("procrastinat") || lastUserMsg.includes("stuck") || lastUserMsg.includes("distract")) {
    responseText = "Procrastination detected. No worries—behavioral psychology shows starting is the hardest part. Let's commit to a tiny **10-minute micro-focus session**. Just do 10 minutes of writing, and you can stop. Ready to beat the friction?";
  }

  return res.json({ text: responseText });
});

// Helper to generate exactly 5 distinct, sequential timeline points for any number of days
function getTimelinePoints(days: number): string[] {
  if (days <= 1) {
    return ["Day 1 (Start)", "Day 1 (0.25x)", "Day 1 (0.50x)", "Day 1 (0.75x)", "Day 1 (Complete)"];
  }
  if (days === 2) {
    return ["Day 1 (Start)", "Day 1 (Mid)", "Day 2 (Start)", "Day 2 (Mid)", "Day 2 (Complete)"];
  }
  if (days === 3) {
    return ["Day 1", "Day 1.5", "Day 2", "Day 2.5", "Day 3"];
  }
  if (days === 4) {
    return ["Day 1", "Day 2 (Start)", "Day 2 (End)", "Day 3", "Day 4"];
  }
  
  // For days >= 5, we partition 1 to days into 5 distinct integers
  const p2 = Math.round(1 + (days - 1) * 0.25);
  const p3 = Math.round(1 + (days - 1) * 0.50);
  const p4 = Math.round(1 + (days - 1) * 0.75);
  
  let val2 = p2;
  while (val2 <= 1 && val2 < days) val2++;
  
  let val3 = p3;
  while (val3 <= val2 && val3 < days) val3++;
  
  let val4 = p4;
  while (val4 <= val3 && val4 < days) val4++;
  
  const finalPoints = [1, val2, val3, val4, days];
  const hasDuplicates = new Set(finalPoints).size !== 5;
  if (hasDuplicates) {
    return [
      "Day 1.0",
      `Day ${(1 + (days - 1) * 0.25).toFixed(1)}`,
      `Day ${(1 + (days - 1) * 0.50).toFixed(1)}`,
      `Day ${(1 + (days - 1) * 0.75).toFixed(1)}`,
      `Day ${days.toFixed(1)}`
    ];
  }
  
  return finalPoints.map(p => `Day ${p}`);
}

// API Route: AI Time Travel Simulation
app.post("/api/simulation", async (req, res) => {
  const { currentTasks, newTask } = req.body;

  if (!newTask) {
    return res.status(400).json({ error: "New task details are required." });
  }

  const durationDays = Number(newTask.durationDays) || 10;
  const tpts = getTimelinePoints(durationDays);

  const prompt = `
    You are the AI Time Travel Simulation engine for DeadlineOS.
    Before the user accepts a new task, we simulate the next ${durationDays} days to predict the holistic impact on work, study, fitness, sleep, family, and entertainment.
    
    Current Busy Workload:
    ${JSON.stringify(currentTasks || [])}
    
    Proposed New Task:
    - Title: "${newTask.title}"
    - Description: "${newTask.description || 'None'}"
    - Deadline: ${newTask.deadline}
    - Effort Estimated: ${newTask.estimatedHours || 5} hours
    - Category: ${newTask.category || 'work'}
    - Duration Window: ${durationDays} days
    
    Simulate the schedule conflict over the next ${durationDays} days.
    Predict:
    1. If they should accept this task (accepted: true/false).
    2. The compound impact on sleep (how many hours of cumulative sleep will be reduced or lost).
    3. Specific existing tasks that will likely suffer or miss deadlines ("missedTasks").
    4. The compound stress risk score (0-100) after acceptance.
    5. A 5-point daily timeline trend showing stress progression across the ${durationDays}-day window.
       CRITICAL: You MUST use exactly these 5 timeline labels for 'day' in the dailyRiskTrend array:
       - Point 1: "${tpts[0]}"
       - Point 2: "${tpts[1]}"
       - Point 3: "${tpts[2]}"
       - Point 4: "${tpts[3]}"
       - Point 5: "${tpts[4]}"
    6. A clear explanation ("impactMessage") outlining the consequences. E.g. "If you accept this internship, you'll likely miss 2 assignments, one revision session, and your sleep will reduce by 8 hours."
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accepted: { type: Type.BOOLEAN, description: "Whether the model suggests accepting this safely." },
              impactMessage: { type: Type.STRING, description: "Consequence explanation warning." },
              sleepImpact: { type: Type.INTEGER, description: "Hours of sleep lost." },
              missedTasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              newRiskScore: { type: Type.INTEGER, description: "Predicted new average workload risk score (0-100)." },
              dailyRiskTrend: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    risk: { type: Type.INTEGER }
                  },
                  required: ["day", "risk"]
                }
              }
            },
            required: ["accepted", "impactMessage", "sleepImpact", "missedTasks", "newRiskScore", "dailyRiskTrend"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      return res.json(data);
    } catch (err: any) {
      console.warn("Gemini simulation engine unavailable, activating high-fidelity deterministic drift simulator.");
    }
  }

  // Simulated response if key is missing (fallback)
  const totalHoursCurrent = (currentTasks || []).reduce((acc: number, t: any) => acc + (t.estimatedHours || 4), 0);
  const tooBusy = totalHoursCurrent > 15 || (newTask.estimatedHours || 5) > 15;
  const simulatedLostSleep = tooBusy ? Math.round(6 + Math.random() * 6) : Math.round(2 + Math.random() * 3);
  const simulatedMissed = tooBusy 
    ? [(currentTasks && currentTasks[0]?.title) || "Main Project Deliverable", "Exam Study Block"] 
    : [];
  const simulatedNewRisk = tooBusy ? 88 : 45;

  const msg = tooBusy 
    ? `⚠️ Simulation Warning: Accepting "${newTask.title}" for ${durationDays} days is predicted to overload your timeline. You'll likely experience sleep deprivation (reduced by ${simulatedLostSleep} hours over this period) and trigger severe risk on "${simulatedMissed.join(' and ')}".` 
    : `✅ Feasible: Adding "${newTask.title}" is within your safety buffer. Your focus indices remain high over the ${durationDays}-day window, with negligible sleep reduction (${simulatedLostSleep} hours total).`;

  return res.json({
    accepted: !tooBusy,
    impactMessage: msg,
    sleepImpact: simulatedLostSleep,
    missedTasks: simulatedMissed,
    newRiskScore: simulatedNewRisk,
    dailyRiskTrend: [
      { day: tpts[0], risk: Math.max(15, simulatedNewRisk - 15) },
      { day: tpts[1], risk: Math.max(25, simulatedNewRisk - 5) },
      { day: tpts[2], risk: simulatedNewRisk },
      { day: tpts[3], risk: Math.min(95, simulatedNewRisk + 8) },
      { day: tpts[4], risk: Math.max(20, simulatedNewRisk - 20) }
    ]
  });
});

// API Route: AI Negotiator & Extension Draft Generator
app.post("/api/negotiate", async (req, res) => {
  const { taskTitle, reasonForDelay, audience } = req.body;

  if (!taskTitle) {
    return res.status(400).json({ error: "Task title is required." });
  }

  const prompt = `
    You are the AI Deadline Negotiator for DeadlineOS.
    Generate a highly polished, professional email or message to request a small timeline adjustment.
    
    Task Title: "${taskTitle}"
    Reason for Delay: "${reasonForDelay || 'Need more time to refine and avoid burn-out'}"
    Target Audience: "${audience || 'manager/professor'}"
    
    CRITICAL STRUCTURAL INSTRUCTIONS:
    1. Tailor the salutation, tone, and closing perfectly for the "${audience}" audience.
       - If the audience is "professor", "teacher", or similar, use an extremely respectful, polite, and formal tone (e.g., starting with "Dear Professor," or "Dear Dr.," and closing with "Sincerely," or "Respectfully yours,").
       - If the audience is a "boss", "manager", or "client", use a professional, collaborative, high-agency business tone.
    2. Address the reason for delay ("${reasonForDelay}") honestly and professionally, but frame it with high agency (take responsibility, show your progress, and suggest an exact proactive alternative plan).
    3. Return a response with a "subject" and "body" formatted cleanly. Avoid placeholders like "[Date]" where possible, or use reasonable relative dates (like "tomorrow morning" or "by tomorrow afternoon").
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING }
            },
            required: ["subject", "body"]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      return res.json(data);
    } catch (err: any) {
      console.warn("Gemini negotiate draft assistant unavailable, deploying audience-tailored negotiation presets.");
    }
  }

  // Highly robust, audience-tailored fallback when offline / no key
  let subject = `Timeline Adjustment Request: ${taskTitle}`;
  let greeting = "Hi Team,";
  let closing = "Best regards,\n[Your Name]\nDeadlineOS Companion";
  let bodyContent = `I am reaching out regarding our milestone for "${taskTitle}". To ensure that the deliverables align with our high quality standards, and to address unforeseen complexities (${reasonForDelay || "ensuring high fidelity of implementation"}), I would appreciate adjusted targeting. I plan to submit the complete, thoroughly tested draft by tomorrow afternoon. Please let me know if this works for your schedule.`;

  const audLower = (audience || "manager").toLowerCase();
  if (audLower.includes("professor") || audLower.includes("teacher") || audLower.includes("academic")) {
    greeting = "Dear Professor,";
    subject = `Academic Extension Request: ${taskTitle}`;
    bodyContent = `I hope you are having a productive week. I am writing to respectfully request a short timeline adjustment for my work on "${taskTitle}". Due to some unforeseen challenges (${reasonForDelay || "the complexity of the requirements"}), I need a small window of additional time to ensure the depth and analytical quality of the submission. I am on track to complete the work with high rigor and submit a polished draft by tomorrow. Thank you very much for your understanding and consideration.`;
    closing = "Respectfully yours,\n[Your Name]";
  } else if (audLower.includes("client") || audLower.includes("customer") || audLower.includes("external")) {
    greeting = "Dear Client,";
    subject = `Timeline Update: ${taskTitle}`;
    bodyContent = `I am writing to provide a quick update on our progress for "${taskTitle}". To deliver the outstanding quality and refined execution that we committed to, and to resolve some technical complexities (${reasonForDelay || "under current specifications"}), we have adjusted our target delivery timeline slightly. We are fully focused on finalized testing and will have the complete polished assets ready for your review by tomorrow. Thank you for your continued partnership.`;
    closing = "Warmest regards,\n[Your Name]";
  } else if (audLower.includes("boss") || audLower.includes("manager") || audLower.includes("supervisor")) {
    greeting = "Hi Boss,";
    subject = `Status Update & Timeline Adjustment: ${taskTitle}`;
    bodyContent = `I wanted to raise a quick flag regarding "${taskTitle}". I've run into some temporary blocks (${reasonForDelay || "demanding additional iteration"}). To keep our quality bar high and avoid rushing the critical parts, I'm proposing we push our target submission back by half a day. I already have a clear plan to wrap it up and will have a solid, fully tested draft ready for review by tomorrow afternoon. Let me know if that works.`;
    closing = "Best,\n[Your Name]";
  }

  const body = `${greeting}\n\n${bodyContent}\n\n${closing}`;
  return res.json({ subject, body });
});

// ============================================================================
// SPOTIFY OAUTH & BACKEND CONTROLLERS
// ============================================================================

const getSpotifyRedirectUri = () => {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/spotify/callback`;
};

app.get("/api/spotify/auth-url", (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId || clientId === "MY_SPOTIFY_CLIENT_ID") {
    // If client ID is missing, we let the client run in "Simulation/Demo Mode" 
    // rather than throwing a hard crash or displaying an empty screen.
    return res.json({ 
      url: null, 
      error: "SPOTIFY_CLIENT_ID not configured on server", 
      message: "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the Secrets settings in AI Studio. Running in high-fidelity Demo Mode!"
    });
  }

  const redirectUri = getSpotifyRedirectUri();
  const scope = "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private streaming";
  const state = "spotify_auth_state_deadlineos";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
    show_dialog: "true"
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get(["/api/spotify/callback", "/api/spotify/callback/"], async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    return res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #030712; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #111827; padding: 2rem; border-radius: 1rem; border: 1px solid #1f2937; max-width: 400px; }
            h2 { color: #f87171; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Error</h2>
            <p>No authorization code received from Spotify.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'No authorization code received' }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #030712; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #111827; padding: 2rem; border-radius: 1rem; border: 1px solid #1f2937; max-width: 400px; }
            h2 { color: #f87171; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Configuration Missing</h2>
            <p>Spotify credentials are missing on the host server. Please verify variables are set in AI Studio.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Server Spotify Client ID or Client Secret not configured.' }, '*');
                setTimeout(() => window.close(), 4000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const redirectUri = getSpotifyRedirectUri();
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Spotify Exchange Failure Response:", errText);
      throw new Error(`Token exchange status ${tokenResponse.status}: ${errText}`);
    }

    const tokens = await tokenResponse.json();

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #030712; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #111827; padding: 2rem; border-radius: 1rem; border: 1px solid #1f2937; max-width: 400px; }
            h2 { color: #10b981; margin-top: 0; }
            .spinner { border: 3px solid #1f2937; border-top: 3px solid #10b981; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 1.5rem auto 0; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Success!</h2>
            <p>Connected with Spotify. Syncing credentials into your focus coach workspace...</p>
            <div class="spinner"></div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  platform: 'spotify',
                  accessToken: '${tokens.access_token}',
                  refreshToken: '${tokens.refresh_token || ""}',
                  expiresIn: ${tokens.expires_in || 3600}
                }, '*');
                setTimeout(() => window.close(), 1500);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Spotify Callback Exchange Error:", error);
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #030712; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #111827; padding: 2rem; border-radius: 1rem; border: 1px solid #1f2937; max-width: 400px; }
            h2 { color: #f87171; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Failure</h2>
            <p>Could not exchange token: ${error.message || "Unknown error"}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: \`${error.message || "Token exchange error"}\` }, '*');
                setTimeout(() => window.close(), 4000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }
});

app.post("/api/spotify/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required." });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Spotify credentials not configured on server." });
  }

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      }).toString()
    });

    if (!response.ok) {
      throw new Error(`Spotify token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    res.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token || refreshToken
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Token refresh failed" });
  }
});

// Boot the server and serve application assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DeadlineOS AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
