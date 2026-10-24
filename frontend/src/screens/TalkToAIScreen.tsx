import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, Loader2, Send, ShieldCheck, UserRound } from 'lucide-react';
import { chatWithAI } from '../services/api';

const starterMessage = {
  role: 'assistant',
  content:
    'I can help answer general questions about medications, side effects, and how medicines are usually taken. For personalized checks (allergies, interactions, duplicate drugs, or doses), use the Scan Prescription check.',
};

const quickQuestions = [
  'What is this medication usually used for?',
  'What are common side effects?',
  'Should this medication be taken with food?',
];

export default function TalkToAIScreen({ patient, setView }: any) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([starterMessage]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || busy) return;

    setInput('');
    const updatedMessages = [...messages, { role: 'user', content: question }];
    setMessages(updatedMessages);
    setBusy(true);

    try {
      // Pass full conversation history so follow-up questions retain context
      const answer = await chatWithAI(question, patient, updatedMessages);
      setMessages((items) => [...items, { role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'I could not reach the AI help service right now.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-5xl flex-col px-6 pb-10 pt-10 md:px-10 md:pt-12">
      <div className="mb-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#087F5B]">Medication information</p>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-serif text-4xl tracking-tight text-[#17211B] md:text-5xl">Talk to AI</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#66736B]">
              Ask medication questions with your profile context. This is an informational helper, not the safety engine.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('input-rx')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-2.5 text-sm font-medium text-[#173A2C] transition-colors hover:border-[#087F5B] hover:text-[#087F5B]"
          >
            Run a Safety Check
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#CFE4D7] bg-[#F0F8F5] px-4 py-3 text-sm text-[#36584A]">
        <ShieldCheck size={17} className="shrink-0 text-[#087F5B]" />
        <span>General medication information only. MediGuard Safety Check remains the source of individualized conflict checks.</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#E4EDE8] bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-5 md:p-7">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[88%] items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isUser ? 'bg-[#087F5B] text-white' : 'bg-[#E8F5EF] text-[#087F5B]'
                    }`}
                  >
                    {isUser ? <UserRound size={16} /> : <Bot size={16} />}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                      isUser ? 'bg-[#087F5B] text-white' : 'bg-[#F3F7F4] text-[#24372D]'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F5EF] text-[#087F5B]">
                  <Bot size={16} />
                </span>
                <div className="rounded-2xl bg-[#F3F7F4] px-4 py-3 text-xs text-[#66736B] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick starter questions */}
        <div className="border-t border-[#EEF3F0] bg-[#FCFDFC] px-5 py-3">
          <p className="text-xs text-[#78867D] mb-2 font-medium">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(q)}
                className="rounded-full border border-[#DCE5DF] bg-white px-3 py-1 text-xs text-[#526057] hover:border-[#087F5B] hover:text-[#087F5B] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat input */}
        <div className="border-t border-[#E4EDE8] p-4 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about medication, timing, or side effects..."
              className="flex-1 rounded-xl border border-[#DCE5DF] bg-[#FAFCFA] px-4 py-2.5 text-sm outline-none focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#087F5B] text-white hover:bg-[#066F50] disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
