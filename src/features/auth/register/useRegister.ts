import { useState } from "react";

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const formValues = Object.fromEntries(formData);

    if (!formValues.email || !formValues.password || !formValues.companyName) {
      setError("All fields are required.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formValues),
        headers: { "Content-Type": "application/json" },
      });

      const resData = await res.json();

      if (!res.ok) {
        const message = Array.isArray(resData.error)
          ? resData.error[0].message
          : resData.error;
        setError(message || "Registration failed.");
        return;
      }

      window.location.assign("/login");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  }
  return { isLoading, error, handleRegister };
}
