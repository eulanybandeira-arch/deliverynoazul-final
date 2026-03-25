import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Legal() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">
          Política de Uso
        </h1>
        <p className="text-muted-foreground">
          Consulte nossa Política de Privacidade e Termos de Uso da plataforma.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Política de Privacidade</CardTitle>
          <CardDescription>
            Última atualização: 24 de Julho de 2024
          </CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Em breve...</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Termos de Uso</CardTitle>
          <CardDescription>
            Última atualização: 24 de Julho de 2024
          </CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Em breve...</p>
        </CardContent>
      </Card>
    </div>
  );
}