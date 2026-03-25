import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function Faq() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">
          Perguntas Frequentes (FAQ)
        </h1>
        <p className="text-muted-foreground">
          Respostas para as dúvidas mais comuns sobre a plataforma.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Em Construção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20">
            <p className="text-3xl font-bold text-muted-foreground">
              Em breve!
            </p>
            <p className="mt-4 text-muted-foreground">
              Estamos preparando uma seção completa com as respostas para as suas principais dúvidas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}