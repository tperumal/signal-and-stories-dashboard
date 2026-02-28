import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — Signal & Stories",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
