import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Eye,
  Trophy,
  Loader2,
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizData {
  topic: string;
  questions: QuizQuestion[];
}

type ActiveMode = 'explain' | 'summarize' | 'quiz' | null;

const SAMPLE_TOPICS = [
  'Photosynthesis',
  'Newton’s Laws of Motion',
  'Why is the sky blue?',
  'Pythagorean Theorem',
  'How DNA replication works',
  'The Solar System',
];

export default function App() {
  const [topic, setTopic] = useState('');
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<ActiveMode>(null);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [resultTopic, setResultTopic] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [revealAllAnswers, setRevealAllAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle API Requests
  const handleExplain = async (customTopic?: string) => {
    const targetTopic = (customTopic !== undefined ? customTopic : topic).trim();
    if (!targetTopic) {
      setError('Please type a topic or question to get an explanation.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingMode('explain');

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: targetTopic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate explanation.');
      }

      setResultTopic(targetTopic);
      setExplanation(data.explanation);
      setActiveMode('explain');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong while generating the explanation.');
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  const handleSummarize = async (customTopic?: string) => {
    const targetTopic = (customTopic !== undefined ? customTopic : topic).trim();
    if (!targetTopic) {
      setError('Please type a topic or question to get a summary.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingMode('summarize');

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: targetTopic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate summary.');
      }

      setResultTopic(targetTopic);
      setSummary(data.summary);
      setActiveMode('summarize');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong while generating the summary.');
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  const handleQuiz = async (customTopic?: string) => {
    const targetTopic = (customTopic !== undefined ? customTopic : topic).trim();
    if (!targetTopic) {
      setError('Please type a topic or question to generate a quiz.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingMode('quiz');
    setSelectedAnswers({});
    setRevealAllAnswers(false);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: targetTopic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz.');
      }

      setResultTopic(targetTopic);
      setQuizData(data);
      setActiveMode('quiz');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong while generating the quiz.');
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  const handleQuickTopic = (sample: string) => {
    setTopic(sample);
    setError(null);
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Calculate quiz score
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = quizData
    ? quizData.questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length
    : 0;
  const isQuizCompleted = quizData && answeredCount === quizData.questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100/70 text-slate-900 pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  EduGenie
                </h1>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                  AI Study Companion
                </span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Powered by Google Gemini</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Intro Tagline */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            What do you want to learn today?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Type any question or subject below. EduGenie provides simple explanations,
            concise study summaries, or custom 5-question quizzes instantly.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 mb-6 transition-all focus-within:border-indigo-400 focus-within:shadow-md focus-within:shadow-indigo-500/5">
          <label htmlFor="topic-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Question or Topic
          </label>
          <div className="relative">
            <textarea
              id="topic-input"
              rows={3}
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleExplain();
                }
              }}
              placeholder="e.g., Why do leaves change color in autumn? or The Water Cycle or Photosynthesis..."
              className="w-full resize-none rounded-xl border border-slate-200 p-3.5 sm:p-4 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {topic && (
              <button
                type="button"
                onClick={() => setTopic('')}
                className="absolute top-3 right-3 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Clear input"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Examples */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Try asking:
            </span>
            {SAMPLE_TOPICS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleQuickTopic(sample)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left ${
                  topic === sample
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Action Buttons Grid */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Explain Button */}
            <button
              type="button"
              onClick={() => handleExplain()}
              disabled={loading}
              className={`relative flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 cursor-pointer shadow-sm ${
                loadingMode === 'explain'
                  ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-500 ring-offset-2'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.99]'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loadingMode === 'explain' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Explaining...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  <span>Explain</span>
                </>
              )}
            </button>

            {/* Summarize Button */}
            <button
              type="button"
              onClick={() => handleSummarize()}
              disabled={loading}
              className={`relative flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 cursor-pointer shadow-sm ${
                loadingMode === 'summarize'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-500 ring-offset-2'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99]'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loadingMode === 'summarize' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Summarize</span>
                </>
              )}
            </button>

            {/* Quiz Button */}
            <button
              type="button"
              onClick={() => handleQuiz()}
              disabled={loading}
              className={`relative flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 cursor-pointer shadow-sm ${
                loadingMode === 'quiz'
                  ? 'bg-violet-600 text-white shadow-violet-500/25 ring-2 ring-violet-500 ring-offset-2'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-[0.99]'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loadingMode === 'quiz' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Quiz...</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5" />
                  <span>Quiz (5 Qs)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Oops! Something went wrong</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner Skeleton */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center my-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 animate-pulse">
              {loadingMode === 'explain' && <BookOpen className="w-7 h-7" />}
              {loadingMode === 'summarize' && <FileText className="w-7 h-7" />}
              {loadingMode === 'quiz' && <HelpCircle className="w-7 h-7" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {loadingMode === 'explain' && 'EduGenie is crafting your explanation...'}
              {loadingMode === 'summarize' && 'EduGenie is summarizing key takeaways...'}
              {loadingMode === 'quiz' && 'EduGenie is generating 5 multiple-choice questions...'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Analyzing concepts and structuring clear student-friendly answers.
            </p>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto mt-5 overflow-hidden">
              <div className="w-full h-full bg-indigo-600 rounded-full animate-indeterminate" />
            </div>
          </div>
        )}

        {/* Answer Output Section */}
        {!loading && activeMode && (
          <div className="space-y-6">
            {/* Mode Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current View:
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                  {activeMode === 'explain' && (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Explanation
                    </>
                  )}
                  {activeMode === 'summarize' && (
                    <>
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      Summary
                    </>
                  )}
                  {activeMode === 'quiz' && (
                    <>
                      <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                      5-Question Quiz
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-500 hidden md:inline truncate max-w-xs">
                  on "{resultTopic}"
                </span>
              </div>

              {/* Quick switch between tabs */}
              <div className="flex items-center gap-1 text-xs">
                {activeMode !== 'explain' && (
                  <button
                    type="button"
                    onClick={() => handleExplain(resultTopic)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3 text-indigo-600" />
                    Explain
                  </button>
                )}
                {activeMode !== 'summarize' && (
                  <button
                    type="button"
                    onClick={() => handleSummarize(resultTopic)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-emerald-600" />
                    Summarize
                  </button>
                )}
                {activeMode !== 'quiz' && (
                  <button
                    type="button"
                    onClick={() => handleQuiz(resultTopic)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3 text-violet-600" />
                    Quiz
                  </button>
                )}
              </div>
            </div>

            {/* 1. EXPLANATION RESULT */}
            {activeMode === 'explain' && explanation && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-white px-5 sm:px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Explanation: {resultTopic}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Easy to understand breakdown for students
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(explanation)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5 sm:p-8 markdown-content">
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* 2. SUMMARIZE RESULT */}
            {activeMode === 'summarize' && summary && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-white px-5 sm:px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Quick Summary: {resultTopic}
                      </h3>
                      <p className="text-xs text-slate-500">
                        High-yield bullet points for fast revision
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(summary)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5 sm:p-8 markdown-content">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* 3. QUIZ RESULT */}
            {activeMode === 'quiz' && quizData && (
              <div className="space-y-4">
                {/* Quiz Header & Score Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                          <HelpCircle className="w-4 h-4" />
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                          5-Question Quiz: {quizData.topic || resultTopic}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Click on your answers to test your knowledge, or reveal the answers below.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setRevealAllAnswers(!revealAllAnswers)}
                        className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{revealAllAnswers ? 'Hide Answers' : 'Reveal Answers'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({});
                          setRevealAllAnswers(false);
                        }}
                        className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
                        title="Reset selections"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress & Score Tracker */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Progress:
                      </span>
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {answeredCount} / {quizData.questions.length} Answered
                      </span>
                    </div>

                    {answeredCount > 0 && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800">
                          Current Score: {correctCount} / {quizData.questions.length} (
                          {Math.round((correctCount / quizData.questions.length) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Completion Banner */}
                  {isQuizCompleted && (
                    <div className="mt-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-indigo-900">
                          {correctCount === 5
                            ? '🎉 Perfect Score! Outstanding work!'
                            : correctCount >= 3
                            ? '👏 Great job! You have a solid grasp of this topic!'
                            : '📚 Good practice! Review the explanations below to master this concept.'}
                        </p>
                        <p className="text-xs text-indigo-700">
                          You scored {correctCount} out of 5. Check the detailed explanations below each question.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5 Questions List */}
                <div className="space-y-4">
                  {quizData.questions.map((q, qIndex) => {
                    const selectedIdx = selectedAnswers[q.id];
                    const isAnswered = selectedIdx !== undefined;
                    const isCorrect = selectedIdx === q.correctIndex;
                    const showFeedback = isAnswered || revealAllAnswers;

                    return (
                      <div
                        key={q.id || qIndex}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm transition-all"
                      >
                        {/* Question Text */}
                        <div className="flex items-start gap-3 mb-4">
                          <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {qIndex + 1}
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                          {q.options.map((option, optIdx) => {
                            const isThisSelected = selectedIdx === optIdx;
                            const isThisCorrect = optIdx === q.correctIndex;

                            let optionClasses =
                              'border border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/80 hover:border-slate-300';

                            if (showFeedback) {
                              if (isThisCorrect) {
                                optionClasses =
                                  'border-2 border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold shadow-xs';
                              } else if (isThisSelected && !isThisCorrect) {
                                optionClasses =
                                  'border-2 border-rose-500 bg-rose-50/80 text-rose-900 font-semibold shadow-xs';
                              } else {
                                optionClasses =
                                  'border border-slate-200 bg-slate-50/40 text-slate-500 opacity-70';
                              }
                            } else if (isThisSelected) {
                              optionClasses =
                                'border-2 border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleAnswerSelect(q.id, optIdx)}
                                className={`text-left p-3.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${optionClasses}`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 uppercase ${
                                    showFeedback && isThisCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : showFeedback && isThisSelected && !isThisCorrect
                                      ? 'bg-rose-600 text-white'
                                      : isThisSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="text-sm font-medium leading-relaxed flex-1">
                                  {option}
                                </span>
                                {showFeedback && isThisCorrect && (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                                )}
                                {showFeedback && isThisSelected && !isThisCorrect && (
                                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 self-center" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {showFeedback && (
                          <div
                            className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                              isCorrect || revealAllAnswers
                                ? 'bg-slate-50 border-slate-200 text-slate-700'
                                : 'bg-rose-50/60 border-rose-100 text-rose-900'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {isCorrect ? (
                                <span className="text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Correct!
                                </span>
                              ) : isAnswered ? (
                                <span className="text-rose-700 flex items-center gap-1">
                                  <XCircle className="w-4 h-4" /> Incorrect
                                </span>
                              ) : (
                                <span className="text-slate-800">Answer Explanation:</span>
                              )}
                              <span className="text-slate-500 font-normal ml-1">
                                Correct Answer: Option {String.fromCharCode(65 + q.correctIndex)} (
                                {q.options[q.correctIndex]})
                              </span>
                            </div>
                            <p className="leading-relaxed text-slate-600">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* First time guide / Features overview when nothing generated yet */}
        {!loading && !activeMode && (
          <div className="mt-8 bg-white/70 backdrop-blur-xs rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              How EduGenie helps students learn faster:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-2.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Easy Explanations</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Breaks complex topics into plain language with analogies, real examples, and clear takeaways.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2.5">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Smart Summaries</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gives you 30-second bullet points, essential vocabulary, and formulas for quick exam cramming.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold mb-2.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Interactive Quizzes</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generates 5 tailored multiple-choice questions with instant scoring, feedback, and answers.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
