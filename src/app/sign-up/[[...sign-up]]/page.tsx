import { Suspense } from "react";
import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <AuthFrame greeting="It's more fun together!">
      <Suspense>
        <SignUp />
      </Suspense>
    </AuthFrame>
  );
}
