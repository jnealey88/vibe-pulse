import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { login, isAuthenticated, handleCallback } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle OAuth callback
  useEffect(() => {
    const processOAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      
      if (code) {
        try {
          await handleCallback(code);
          toast({
            title: "Login successful",
            description: "You have been successfully logged in",
          });
          setLocation("/dashboard");
        } catch (error) {
          console.error("Authentication error:", error);
          toast({
            title: "Authentication failed",
            description: error instanceof Error ? error.message : "Failed to authenticate with Google",
            variant: "destructive",
          });
        }
      }
    };
    
    processOAuthCallback();
  }, [handleCallback, setLocation, toast]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-icons text-3xl text-primary">analytics</span>
              <h1 className="text-2xl font-medium font-google-sans">GA4 Insights</h1>
            </div>
          </div>
          <CardTitle className="text-2xl font-google-sans">Welcome to GA4 Insights</CardTitle>
          <CardDescription>
            Connect your Google Analytics 4 data and get AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in with your Google account to connect to your Google Analytics 4 data.
            </p>
            <p className="text-sm text-muted-foreground">
              We'll help you analyze your website performance and provide actionable insights.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={login} className="w-full md:w-auto">
            <span className="material-icons mr-2">login</span>
            Sign in with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
