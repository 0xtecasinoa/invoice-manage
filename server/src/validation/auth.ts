import { z } from "zod";

const email = z.string().email("有効なメールアドレスを入力してください。").max(255);
const password = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください。")
  .max(128);
const name = z.string().min(1, "お名前を入力してください。").max(100);

export const registerSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
    name,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "パスワードを入力してください。"),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
