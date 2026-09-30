// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, Loader2, MessageCircle, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { chatWithAI } from '../services/api';

const starterMessage = {
  role: 'assistant',
  content:
    'I can help with general medication information. For personalized interaction, allergy, duplicate-therapy, disease-conflict, or dose-risk questions, use Safety Check so MediGuard can run the evidence-backed checks first.',
};

const quickQuestions = [
  'What is this medication usually used for?',
  'What are common side effects of this medicine?',
  'What should I know about taking this medication with food?',
];

export default function TalkToAIScreen({ patient, setView }) {
  const [messages, setMessages] = useState([starterMessage]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || busy) return;

    setInput('');
    setMessages((items) => [...items, { role: 'user', content: question }]);
    setBusy(true);

    try {
      const answer = await chatWithAI(question, patient);
      setMessages((items) => [...items, { role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          content: error?.message || 'I could not reach the AI help service right now.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const useQuestion = (question) => {
    setInput(question);
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col px-6 pb-10 pt-10 md:px-10 md:pt-12">
      <div className="mb-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#087F5B]">Medication information</p>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-serif text-4xl tracking-tight text-[#17211B] md:text-5xl">Talk to AI</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#66736B]">
              Ask basic medication questions with relevant profile context. This is an information helper, not the safety engine.
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
        <span>General medication information only. The safety pipeline remains the source of individualized conflict checks.</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#E4EDE8] bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-5 md:p-7">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[88%] items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isUser ? 'bg-[#087F5B] text-white' : 'bg-[#E8F5EF] text-[#087F5B]'}`}>
                    {isUser ? <UserRound size={16} /> : <Bot size={16} />}
                  </span>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? 'bg-[#087F5B] text-white' : 'bg-[#F3F7F4] text-[#24372D]'}`}>
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}

          {messages.length === 1 && (
            <div className="pt-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8B9991]">
                <Sparkles size={14} className="text-[#087F5B]" /> Try a question
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => useQuestion(question)}
                    className="rounded-2xl border border-[#E4EDE8] bg-[#FAFCFB] px-4 py-3 text-left text-sm leading-5 text-[#4F6258] transition-colors hover:border-[#BFD7C8] hover:bg-[#F0F8F5]"
                  >
                    <MessageCircle size={14} className="mb-2 text-[#087F5B]" />
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-[#66736B]">
              <Loader2 size={16} className="animate-spin text-[#087F5B]" />
              Thinking…
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="border-t border-[#E4EDE8] bg-[#FAFCFB] p-4">
          <div className="flex gap-2 rounded-2xl border border-[#DCE5DF] bg-white p-2 shadow-sm">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about a medication…"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#17211B] outline-none placeholder:text-[#98A59E]"
              aria-label="Ask the medication AI a question"
              disabled={busy}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F5B] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#043A2B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
              Send
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#8A9790]">
            Do not use this chat to decide whether to start, stop, or change a medication. Use the Safety Check for individualized review.
          </p>
        </div>
      </div>
    </section>
  );
}
