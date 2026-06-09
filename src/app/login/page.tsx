"use client";

import { useState } from "react";
import { Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const hasSupabase = Boolean(
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSupabase) {
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Private AI Content Factory</CardTitle>
          <CardDescription>Single-user autonomous content studio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {hasSupabase ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Supabase not configured. Continue to dashboard in dev mode.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : hasSupabase ? "Sign In" : "Enter Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
