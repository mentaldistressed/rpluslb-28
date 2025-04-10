
import { z } from "zod";

export const formSchema = z.object({
  email: z.string().email({
    message: "Пожалуйста, введите валидный адрес электронной почты",
  }),
  password: z
    .string()
    .min(6, {
      message: "Пароль должен содержать не менее 6 символов",
    }),
  name: z.string().min(2, {
    message: "Имя должно содержать не менее 2 символов",
  }),
});
