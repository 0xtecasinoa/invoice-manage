import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import logoTate from "@/assets/logo-tate.png";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const registerSchema = z
  .object({
    name: z.string().min(1, "お名前を入力してください。").max(100),
    email: z.string().email("有効なメールアドレスを入力してください。"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { user, register: doRegister, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);
    try {
      await doRegister(values.name, values.email, values.password, values.confirmPassword);
      toast.success("登録が完了しました");
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "登録に失敗しました。";
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== Left branding panel (same as Login) ===== */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1a3050] to-[#0f1f35] items-center justify-center p-12">
        <div className="absolute top-[-5%] left-[-8%] w-72 h-72 rounded-full bg-[#2a5a8a]/30 blur-xl pointer-events-none" />
        <div className="absolute bottom-[-8%] right-[-5%] w-80 h-80 rounded-full bg-[#3a7ab8]/20 blur-2xl pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] w-40 h-40 rounded-[60%_40%_50%_50%/50%_60%_40%_50%] bg-[#4a90c4]/15 blur-lg pointer-events-none rotate-12" />
        <div className="absolute bottom-[25%] left-[5%] w-48 h-28 rounded-full bg-[#5aa0d0]/10 blur-lg pointer-events-none -rotate-6" />
        <div className="absolute top-[60%] right-[25%] w-24 h-24 rounded-full bg-[#6ab0da]/15 blur-md pointer-events-none" />
        <div className="absolute top-[10%] left-[40%] w-16 h-16 rounded-full bg-[#8ac0e0]/20 blur-sm pointer-events-none" />

        <svg className="absolute top-[12%] left-[10%] w-20 h-20 text-white/10" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="30" width="60" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M30 30V15h20v15" stroke="currentColor" strokeWidth="2" />
          <path d="M10 45h60" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-[18%] right-[12%] w-24 h-24 text-white/10" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2" />
          <path d="M40 20v20l14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="absolute top-[45%] left-[8%] w-16 h-16 text-white/8" viewBox="0 0 64 64" fill="none">
          <path d="M8 56l24-48 24 48H8z" stroke="currentColor" strokeWidth="2" />
          <path d="M32 32v12M32 48v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-[40%] right-[8%] w-14 h-14 text-white/8" viewBox="0 0 56 56" fill="none">
          <rect x="8" y="8" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 20h40M20 20v28M36 20v28" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div
            className="rounded-full w-44 h-44 flex items-center justify-center p-5 bg-white border border-white/80 mb-8"
            style={{
              boxShadow: "0 12px 40px -6px rgba(0,0,0,0.35), inset 2px 2px 0 rgba(255,255,255,1), inset -2px -2px 0 rgba(0,0,0,0.05)",
            }}
          >
            <img
              src={logoTate}
              alt="KATATI Co.,Ltd."
              className="max-h-full max-w-full w-auto h-auto object-contain"
            />
          </div>
          <h1
            className="text-3xl font-bold text-white tracking-wide mb-3"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            請求原価管理SaaS
          </h1>
          <p className="text-blue-200/70 text-base leading-relaxed mb-8">
            建設業向けの請求書・原価管理を<br />一つのプラットフォームで効率化
          </p>

          <div className="space-y-4 w-full">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-blue-100/80">見積・請求書をワンクリックで作成</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-sm text-blue-100/80">リアルタイムで原価を可視化</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-blue-100/80">施工実績と提出状況を一括管理</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Right form panel ===== */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f7f4] px-6 py-12 lg:px-12 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-[#e8e4de]/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-8%] left-[-6%] w-64 h-64 rounded-full bg-[#ddd8d0]/50 blur-3xl pointer-events-none" />

        <div className="w-full max-w-[400px] relative z-10">
          <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-1">新規登録</h2>
          <p className="text-sm text-[#6b7a8d] text-center mb-6">アカウント情報を入力してください</p>

          <a
            href={`${API_BASE}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-[#d5d0c8] bg-white text-[#1e3a5f] font-medium shadow-sm hover:bg-slate-50 transition-colors mb-6"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Googleで続行
          </a>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#d5d0c8]" />
            </div>
            <p className="relative text-xs text-[#6b7a8d] text-center bg-[#f8f7f4] px-2">または メールで登録</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#3a4f66] text-sm font-medium">お名前</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="山田 太郎"
                        className="h-11 rounded-lg bg-white border-[#d5d0c8] text-[#1e3a5f] placeholder:text-[#a0a8b2] focus-visible:ring-2 focus-visible:ring-[#3a7ab8]/40 focus-visible:border-[#3a7ab8] shadow-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#3a4f66] text-sm font-medium">メールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@katati.co.jp"
                        className="h-11 rounded-lg bg-white border-[#d5d0c8] text-[#1e3a5f] placeholder:text-[#a0a8b2] focus-visible:ring-2 focus-visible:ring-[#3a7ab8]/40 focus-visible:border-[#3a7ab8] shadow-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#3a4f66] text-sm font-medium">パスワード</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="8文字以上"
                        className="h-11 rounded-lg bg-white border-[#d5d0c8] text-[#1e3a5f] placeholder:text-[#a0a8b2] focus-visible:ring-2 focus-visible:ring-[#3a7ab8]/40 focus-visible:border-[#3a7ab8] shadow-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#3a4f66] text-sm font-medium">パスワード（確認）</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-11 rounded-lg bg-white border-[#d5d0c8] text-[#1e3a5f] placeholder:text-[#a0a8b2] focus-visible:ring-2 focus-visible:ring-[#3a7ab8]/40 focus-visible:border-[#3a7ab8] shadow-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {submitError && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-base bg-[#1e3a5f] hover:bg-[#2a4f7a] text-white shadow-md hover:shadow-lg transition-all"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "登録中..." : "登録する"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[#6b7a8d]">
              すでにアカウントをお持ちの方は
              <Link
                to="/login"
                className="ml-1.5 text-[#1e3a5f] font-semibold hover:underline underline-offset-2"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
