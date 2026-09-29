import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-flash-latest';

async function generateWithRetry(params: any): Promise<any> {
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL, 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isUnavailable =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('429');
        if (!isUnavailable) {
          throw err;
        }
        // Wait 800ms before retry
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }
  throw lastError;
}

function formatErrorMessage(error: any): string {
  const raw = error?.message || String(error);
  if (raw.includes('429') || raw.includes('quota') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'EduGenie is currently receiving many questions! Please wait a few seconds and try again.';
  }
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return 'EduGenie service is experiencing a temporary spike in demand. Please try again in a few seconds.';
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error && parsed.error.message) {
      return parsed.error.message;
    }
  } catch {
    // ignore
  }
  return 'Unable to generate response right now. Please try again in a moment.';
}

// API: Explain
app.post('/api/explain', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({ error: 'Please enter a topic or question to explain.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    const response = await generateWithRetry({
      contents: `Explain this topic or answer this question for a student: "${topic.trim()}"`,
      config: {
        systemInstruction: `You are EduGenie, an expert, encouraging, and friendly learning tutor for students.
Your goal is to make any concept easy and enjoyable to understand.
Structure your explanation nicely using markdown:
- **Core Concept**: 1-2 intuitive sentences explaining what this is.
- **Relatable Analogy**: An everyday metaphor or real-world comparison that makes it click immediately.
- **How It Works / Key Components**: 3-4 clearly explained bullet points or sub-sections.
- **Practical Example**: A short concrete scenario.
- **Key Takeaway**: 1 memorable golden takeaway rule or summary for exams.
Keep language accessible, lively, engaging, and clear. Avoid dry academic jargon without defining it first.`,
      },
    });

    const explanation = response.text || 'Unable to generate explanation.';
    res.json({ explanation });
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    res.status(500).json({
      error: formatErrorMessage(error),
    });
  }
});

// API: Summarize
app.post('/api/summarize', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({ error: 'Please enter a topic or question to summarize.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    const response = await generateWithRetry({
      contents: `Provide a concise, high-yield summary of this topic for quick revision: "${topic.trim()}"`,
      config: {
        systemInstruction: `You are EduGenie, a high-yield study revision assistant for students.
Generate a concise, crystal-clear, structured summary designed for fast study and review:
- **Summary in 30 Seconds**: A 1-2 sentence punchy executive summary.
- **Essential Bullet Points**: 3 to 5 core principles, dates, mechanisms, or rules to know.
- **Must-Know Terminology / Formulas**: Key terms, vocabulary, or equations with brief definitions.
- **Common Pitfall / Misconception**: 1 common confusion students make and how to avoid it.
Use clean markdown with bullet points and bold highlights for rapid scanning.`,
      },
    });

    const summary = response.text || 'Unable to generate summary.';
    res.json({ summary });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      error: formatErrorMessage(error),
    });
  }
});

// API: Quiz
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({ error: 'Please enter a topic or question to generate a quiz.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    const response = await generateWithRetry({
      contents: `Create exactly 5 high quality multiple choice quiz questions testing understanding of: "${topic.trim()}".`,
      config: {
        systemInstruction: `You are EduGenie, an educational quiz creator.
Generate exactly 5 distinct multiple-choice questions for students that test conceptual clarity and application of the topic.
Ensure:
1. Each question is clear, fair, and educational.
2. Provide exactly 4 options per question.
3. Randomize the position of the correct answer (do not always make option A or C correct).
4. Provide the exact 0-based index of the correct option (0 for 1st option, 1 for 2nd, 2 for 3rd, 3 for 4th).
5. Include an insightful, encouraging explanation explaining why the correct option is right and clarifying any tricky nuances.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER, description: 'Question number (1 to 5)' },
                  question: { type: Type.STRING, description: 'The question text' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exactly 4 distinct answer choices',
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: '0-based index (0, 1, 2, or 3) of the correct choice in options',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Brief explanation why the answer is correct',
                  },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawJson);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid quiz response structure');
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      error: formatErrorMessage(error),
    });
  }
});

// Setup dev Vite middleware or production static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduGenie server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
