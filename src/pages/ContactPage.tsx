import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CheckCircle2, CircleHelp, Send } from 'lucide-react';

const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined;

interface IFormState {
  message: string;
  contact: string;
}

const INITIAL_FORM: IFormState = { message: '', contact: '' };

/** 提供轻量的意见反馈入口，并通过 Web3Forms 将内容转发到站长邮箱。 */
export const FeedbackForm: React.FC = () => {
  const pageRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState<IFormState>(INITIAL_FORM);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!pageRef.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        '[data-contact-reveal]',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
        },
      );
    }, pageRef);
    return () => context.revert();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ACCESS_KEY || ACCESS_KEY === '你的_access_key') {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: 'Sakura Offer Hub｜新的意见反馈',
          from_name: 'Sakura Offer Hub',
          ...form,
        }),
      });
      if (!response.ok) throw new Error('submit failed');
      setForm(INITIAL_FORM);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main
      ref={pageRef}
      className="flex-1 overflow-y-auto bg-[#fffaf9] px-5 py-5 md:overflow-hidden md:px-10 md:py-6"
    >
      <div className="mx-auto max-w-3xl">
        <div data-contact-reveal className="mb-5 border-b border-slate-200 pb-4">
          <div className="mb-3 flex items-center gap-3 text-pink-500">
            <CircleHelp size={22} strokeWidth={1.8} />
            <span className="text-xs font-bold tracking-[0.28em]">CONTACT</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">意见反馈</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            非常感谢你愿意为这个网站提意见，和我一起把它做得更好。也欢迎来认识一下，交个朋友～
          </p>
        </div>
        <form
          data-contact-reveal
          onSubmit={handleSubmit}
          className="border border-slate-200 bg-white p-5 md:p-6"
        >
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              你的意见 <i className="text-pink-500">*</i>
            </span>
            <textarea
              required
              minLength={5}
              rows={4}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="写下你想说的话，至少 5 个字～"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
            />
          </label>
          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              怎么联系你？ <em className="font-normal text-slate-400">选填</em>
            </span>
            <input
              value={form.contact}
              onChange={(event) => setForm({ ...form, contact: event.target.value })}
              placeholder="邮箱 / 微信号，方便后续认识或回复"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
            />
          </label>
          <button
            disabled={status === 'sending'}
            className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-pink-400 bg-white px-8 py-3.5 text-base font-bold text-pink-600 transition hover:bg-pink-50 disabled:cursor-wait disabled:opacity-60"
          >
            {status === 'sending' ? (
              '正在提交…'
            ) : (
              <>
                <Send size={17} /> 提交意见
              </>
            )}
          </button>
          {status === 'success' && (
            <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={17} /> 收到啦，谢谢你的消息！
            </p>
          )}
          {status === 'error' && (
            <p className="mt-5 text-center text-sm font-semibold text-rose-500">
              暂时还不能发送，请确认环境变量里的 Access Key 已填写。
            </p>
          )}
          <p className="mt-3 text-center text-xs leading-5 text-slate-400">
            联系方式仅用于回复本次反馈，不会用于其他用途。
          </p>
        </form>
      </div>
    </main>
  );
};

export default FeedbackForm;
