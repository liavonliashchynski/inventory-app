import LoginForm from "@/features/auth/login/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    verification?: string;
    verified?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginForm
      initialEmail={params.email}
      initialVerificationState={params.verification}
      initialVerifiedState={params.verified}
    />
  );
}
