import { Suspense } from "react";
import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthFrame>
      <Suspense>
        <SignIn />
      </Suspense>
    </AuthFrame>
  );
}
