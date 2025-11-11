import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasTokens, setHasTokens] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for access/refresh tokens in URL fragment
    const raw = window.location.hash || window.location.search || "";
    const paramsString = raw.startsWith("#") || raw.startsWith("?") ? raw.slice(1) : raw;
    const params = new URLSearchParams(paramsString);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      setHasTokens(true);
      // set session so updateUser will work
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            setHasTokens(false);
          }
        });
    } else {
      setHasTokens(false);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasTokens) {
      toast({ title: "Error", description: "No recovery tokens found. Request a new reset link.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    }

    if (password.length < 6) {
      return toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // clear url tokens and go to dashboard
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      toast({ title: "Success", description: "Password updated and signed in.", });
      setPassword("");
      setConfirmPassword("");
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <ThemeToggle />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter a new password to complete recovery</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !hasTokens}>
              {loading ? "Updating..." : hasTokens ? "Update Password" : "No tokens"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
