import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await login(email, password);
    
    if (error) {
      toast.error("Erro no login", {
        description: error,
      });
    } else {
      toast.success("Login realizado com sucesso!");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 px-4 sm:px-0">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 font-semibold mb-4">
            <img src="/logo.png" alt="Logo" className="h-10 w-10" />
            <span className="text-2xl whitespace-nowrap">
              <span className="italic bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">
                delivery
              </span>
              <span className="text-primary">
                noazul
              </span>
            </span>
          </div>
          <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
