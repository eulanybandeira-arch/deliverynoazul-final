import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, ChefHat, BarChart3, Package, Calculator, ArrowRight, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import dashboardPreviewImage from "@/assets/dashboard-preview.png";
import deliveryNoAzulWordmark from "@/assets/deliverynoazul-wordmark.png";

const faqItems = [
  {
    question: "O deliverynoazul substitui o meu sistema de caixa (PDV)?",
    answer: "Não, ele é o complemento que falta. Enquanto o seu PDV (como Saipos ou Alochefia) foca na operação de venda e entrega, o deliverynoazul foca na sua lucratividade. Nós pegamos os dados da sua operação e transformamos em inteligência financeira para você saber exatamente quanto está ganhando."
  },
  {
    question: "Eu não entendo nada de finanças ou análise de dados. Vou conseguir usar?",
    answer: "Sim. O sistema foi desenhado para ser intuitivo. Se você sabe tirar uma foto com o celular, você já sabe usar a nossa maior ferramenta: o Scanner IA. Você não precisa ser um expert; o sistema organiza os gráficos e te dá os alertas de forma visual e simples."
  },
  {
    question: "Tenho que cadastrar tudo na mão? Isso não toma muito tempo?",
    answer: "Essa é a melhor parte: não. O nosso Scanner IA encurta o caminho. Você tira foto dos seus cupons, notas fiscais e fichas técnicas, e a inteligência do sistema faz o cadastro para você. O objetivo é devolver o seu tempo, não criar mais trabalho."
  },
  {
    question: "O que acontece se o preço do meu fornecedor subir?",
    answer: "O sistema te avisa na hora. Graças ao monitoramento de insumos, o deliverynoazul detecta aumentos nos seus custos e sugere ajustes no seu preço dinâmico para garantir que sua margem de lucro não seja \"engolida\" sem você perceber."
  },
  {
    question: "Posso cancelar minha assinatura quando quiser?",
    answer: "Sim. No plano mensal (Decolagem), você tem total flexibilidade para cancelar a qualquer momento sem letras miúdas. No plano anual, você garante o menor preço para manter sua gestão no Piloto Automático o ano todo."
  },
  {
    question: "Eu já tenho um sistema (PDV), por que preciso do deliverynoazul?",
    answer: "A maioria dos sistemas de caixa (como Saipos ou Alochefia) foca em registrar a venda. Eles são ótimos para mandar o pedido para a cozinha, mas péssimos em te dizer se você está realmente lucrando. O deliverynoazul entra onde o seu sistema para: ele é a Inteligência Financeira. Enquanto seu PDV anota o pedido, nós usamos o Scanner IA para ler seus custos reais, atualizar suas fichas técnicas e te avisar — em tempo real — se o aumento do preço do óleo ou da carne está \"comendo\" o seu lucro. Em resumo: seu sistema atual cuida da venda, o deliverynoazul cuida do seu dinheiro."
  },
  {
    question: "Posso usar apenas o deliverynoazul, sem ter outro sistema?",
    answer: "Com certeza. Se o seu foco principal é ter o controle total do seu lucro, organizar suas fichas técnicas e dominar seus custos, o deliverynoazul é tudo o que você precisa. Ele é o sistema ideal para quem quer profissionalizar a gestão financeira sem a complexidade de softwares pesados. Vale lembrar que, se você precisar de funções específicas de \"frente de caixa\" — como integração direta com a impressora da cozinha ou gestão de entregadores do iFood em tempo real —, você pode usar o deliverynoazul em conjunto com um PDV simples. Mas, para saber se o seu negócio está ganhando ou perdendo dinheiro, o deliverynoazul é o único sistema que você realmente precisa ter no seu comando."
  },
  {
    question: "Consigo exportar relatórios em Excel e PDF com a minha marca?",
    answer: "Sim. O deliverynoazul permite que você gere relatórios detalhados em PDF e planilhas em Excel para ter o controle total dos seus dados fora do sistema. E o melhor: você pode personalizar os documentos com o logotipo da sua empresa. Isso é ideal para apresentar resultados para sócios, enviar dados organizados para o seu contador ou simplesmente arquivar sua evolução mensal com uma aparência profissional e exclusiva do seu negócio."
  },
  {
    question: "O deliverynoazul integra com o meu sistema atual?",
    answer: "O deliverynoazul foi desenhado para ser uma camada de inteligência independente, o que significa que ele funciona perfeitamente com qualquer sistema que você já utilize (como Saipos, Alochefia ou iFood). Em vez de depender de integrações técnicas demoradas, nós usamos a tecnologia do Scanner IA. Basta uma foto do seu cupom ou nota fiscal para o sistema ler os dados e alimentar sua gestão de lucro. Assim, você tem a liberdade de usar o PDV que preferir na frente de caixa, enquanto o deliverynoazul cuida da estratégia e do dinheiro no seu bolso sem conflitos técnicos."
  },
];


const plans = [
  {
    name: "Caixa no Azul",
    subtitle: "Plano Mensal",
    price: "R$ 99",
    period: "/mês",
    description: "Entenda para onde está indo o seu lucro sem planilhas ou complicação. Pare de pagar para trabalhar e enxergue a cor do dinheiro.",
    badge: "Sem fidelidade",
    features: [
      { text: "Auditoria inteligente das vendas", included: true },
      { text: "Monitoramento de taxas de plataforma", included: true },
      { text: "Identificação de erosão de lucro em tempo real", included: true },
      { text: "Engenharia de Precificação Automatizada", included: true },
      { text: "Alertas de margem comprometida", included: true },
      { text: "Visão clara do lucro real por produto", included: true },
      { text: "Índice de Rendimento e Perdas de Insumos", included: false },
      { text: "Equipe que Veste a Camisa", included: false },
    ],
    buttonText: "Acelerar meu lucro",
    paymentLink: "https://pay.kiwify.com.br/nEiLcsJ",
    highlighted: false,
  },
  {
    name: "Lucro Sob Comando",
    subtitle: "Plano Anual",
    price: "R$ 79",
    period: "/mês",
    annualPrice: "R$ 958,80 à vista",
    annualNote: "Parcelamento em até 12x com acréscimo de juros",
    discount: "R$240,00 de desconto",
    description: "Para quem quer assumir o controle do lucro de forma definitiva, com visão estratégica e economia no investimento.",
    badge: "O MAIS VENDIDO",
    features: [
      { text: "Tudo do Plano Caixa no Azul", included: true },
      { text: "Economia no valor mensal", included: true },
      { text: "Planejamento anual com mais estabilidade", included: true },
      { text: "Prioridade em atualizações estratégicas", included: true },
      { text: "Índice de Rendimento e Perdas de Insumos", included: true },
      { text: "Equipe que Veste a Camisa", included: true },
    ],
    buttonText: "Quero acelerar meu lucro",
    paymentLink: "https://pay.kiwify.com.br/pLEkxZc",
    highlighted: true,
  },
];

const features = [
  {
    icon: ChefHat,
    title: "Gestão de Receitas",
    description: "Cadastre suas receitas com ingredientes, custos e margens de lucro automaticamente calculadas.",
  },
  {
    icon: Package,
    title: "Controle de Estoque",
    description: "Acompanhe seu inventário em tempo real com alertas de estoque baixo e histórico de movimentações.",
  },
  {
    icon: BarChart3,
    title: "Fluxo de Caixa",
    description: "Registre entradas e saídas, visualize relatórios e tenha controle total das suas finanças.",
  },
  {
    icon: Calculator,
    title: "Precificação Inteligente",
    description: "Calcule o preço ideal dos seus produtos considerando custos, taxas e margem de lucro desejada.",
  },
];

const Landing = () => {
  const navigate = useNavigate();

  const handlePlanClick = (paymentLink: string) => {
    if (paymentLink) {
      window.open(paymentLink, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <img src="/logo.png" alt="Símbolo deliverynoazul" className="h-7 w-7 md:h-8 md:w-8" />
            <img
              src={deliveryNoAzulWordmark}
              alt="deliverynoazul"
              className="hidden sm:block h-4 md:h-6 w-auto select-none"
              draggable={false}
            />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" className="hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)]" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button 
              size="sm"
              className="text-xs md:text-sm shadow-[0_0_20px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)]" 
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen md:min-h-screen flex items-center justify-center px-4 pt-24 md:pt-20 pb-12 md:pb-10 lg:pt-16 lg:pb-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 md:mb-4 lg:mb-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 lg:whitespace-nowrap">
              <Sparkles className="w-3 h-3 mr-1" />
              A ferramenta secreta que os deliveries lucrativos usam para abandonar planilhas e focar no crescimento
            </Badge>
          </div>
          <div className="grid md:grid-cols-[1fr_1fr] lg:grid-cols-2 gap-8 md:gap-6 lg:gap-6 items-center">
            <div className="text-center md:text-left flex flex-col justify-center items-center md:items-start md:px-4">
              <h1 className="text-3xl sm:text-2xl md:text-xl lg:text-3xl font-bold mb-4 md:mb-4 lg:mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight md:leading-normal lg:leading-tight max-w-2xl lg:max-w-2xl px-2 sm:px-0">
                Ative o Cérebro Financeiro no seu negócio e saiba exatamente onde seu dinheiro está fugindo (e como trazê-lo de volta)
              </h1>
              <div className="grid grid-cols-1 gap-2 md:gap-2 lg:gap-2 mb-4 md:mb-4 lg:mb-3 w-full max-w-md md:max-w-xs lg:max-w-lg md:justify-self-start">
                <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-2.5 md:p-2 lg:p-3 text-left">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs md:text-xs lg:text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Scanner IA:</span> Chega de digitação manual. Basta uma foto para a IA cadastrar cupons, notas e receitas, transformando o processo chato em organização automática e instantânea.
                    </p>
                  </div>
                </div>
                <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-2.5 md:p-2 lg:p-3 text-left">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs md:text-xs lg:text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Inteligência que Protege seu Bolso:</span> Antecipe-se aos prejuízos com alertas automáticos de estoque baixo e aumento de custos. Tome decisões rápidas e seguras sobre o seu negócio sem precisar ser um expert em análise de dados.
                    </p>
                  </div>
                </div>
                <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-2.5 md:p-2 lg:p-3 text-left">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs md:text-xs lg:text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Decisões Estratégicas por Gráficos:</span> Visualize instantaneamente quais receitas trazem mais lucro real através de gráficos inteligentes. Use o alerta de preço dinâmico para substituir o trabalho manual por uma estratégia que faz seu negócio crescer.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-base sm:text-lg md:text-sm md:whitespace-nowrap lg:text-lg font-semibold text-foreground mb-3 md:mb-4 lg:mb-5 text-center md:text-center lg:text-left leading-relaxed">
                SEU NEGÓCIO NO AUTOMÁTICO.<br className="sm:hidden" /> SEU DELIVERY NO AZUL.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-3 lg:gap-3 w-full sm:w-auto justify-center md:justify-center lg:justify-start">
                <Button 
                  size="lg" 
                    className="w-full sm:w-auto md:h-9 md:px-4 md:text-sm lg:h-10 lg:px-8 lg:text-base shadow-[0_0_20px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)]" 
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Ver Planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                    className="w-full sm:w-auto md:h-9 md:px-4 md:text-sm lg:h-10 lg:px-8 lg:text-base hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] active:shadow-[0_0_20px_hsl(var(--primary)/0.6)]" 
                  onClick={() => navigate("/login")}
                >
                  Já tenho conta
                </Button>
              </div>
            </div>
            <div className="flex justify-center md:justify-center lg:justify-center items-center md:overflow-visible">
              <img 
                src={dashboardPreviewImage} 
                alt="Preview do dashboard do deliverynoazul" 
                className="w-[120%] max-w-none md:w-[180%] md:-translate-x-[15%] lg:-translate-x-[10%] lg:w-[110%] lg:mr-0 xl:max-w-5xl rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              O mercado está cheio de sistemas para emitir pedidos. Nós não somos um deles. Somos uma plataforma de Engenharia de Lucro criada para controlar o ponto mais negligenciado do seu negócio: sua margem líquida.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Você continua usando seu sistema atual. O que muda é o controle: custo real, taxa real e lucro real, antes da venda acontecer.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Existe uma nova forma de proteger o lucro no seu negócio de alimentação.
            </h2>
            <div className="text-muted-foreground text-lg max-w-2xl mx-auto space-y-4">
              <p>Escolha o plano ideal para sair do improviso e entrar na engenharia de margem.</p>
              <p className="font-semibold text-foreground">
                7 dias para testar.<br />
                Sem risco. Sem planilha. Sem achismo.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-300 ${
                  plan.highlighted 
                    ? "border-primary shadow-lg shadow-primary/20 scale-105" 
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 left-0 right-0 text-center text-sm py-1 font-medium ${
                    plan.highlighted 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {plan.badge}
                  </div>
                )}
                <CardHeader className={plan.badge ? "pt-10" : ""}>
                  <CardTitle className="text-xl">
                    {plan.name}
                    {plan.subtitle && (
                      <span className="block text-sm font-normal text-muted-foreground mt-1">
                        {plan.subtitle}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                    {plan.annualPrice && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.annualPrice}
                      </div>
                    )}
                    {plan.annualNote && (
                      <div className="text-xs text-muted-foreground/80 mt-0.5">
                        {plan.annualNote}
                      </div>
                    )}
                    {plan.discount && (
                      <div className="text-sm text-primary font-medium mt-1">
                        {plan.discount}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span className={cn(
                          "text-sm",
                          feature.included ? "text-muted-foreground" : "text-muted-foreground/50 line-through"
                        )}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full h-auto py-3 text-sm leading-tight whitespace-normal ${
                      plan.highlighted 
                        ? "shadow-[0_0_20px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)]" 
                        : "hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] active:shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handlePlanClick(plan.paymentLink)}
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Bônus Exclusivos
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
              Exclusivo para quem escolhe o Plano Anual – Lucro Sob Comando
            </h2>
            <p className="text-muted-foreground text-lg">
              Quem decide assumir o lucro de forma definitiva recebe acesso a dois recursos estratégicos adicionais
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-foreground mb-2">Índice de Rendimento e Perdas de Insumos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Descubra exatamente quanto você está perdendo no preparo dos alimentos e identifique desperdícios invisíveis que corroem sua margem todos os meses.
                </p>
                <p className="text-xs font-medium text-primary italic">
                  Você não perde lucro apenas nas taxas. Você perde lucro dentro da própria cozinha.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-semibold text-foreground mb-2">Equipe que Veste a Camisa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aprenda como estruturar contratação, cultura e mentalidade de dono dentro da sua operação.
                </p>
                <p className="text-xs font-medium text-primary italic">
                  Lucro não depende só de sistema. Depende de gente alinhada com ele.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Button between Bonus and FAQ */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <Button 
            size="lg" 
            className="shadow-[0_0_20px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)]"
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
          >
            Quero acelerar meus lucros
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
              Perguntas Frequentes
            </h2>
            <p className="text-muted-foreground">
              Tire suas dúvidas sobre o deliverynoazul
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Junte-se a centenas de empreendedores que já estão lucrando mais com o deliverynoazul.
          </p>
          <Button 
            size="lg" 
            className="shadow-[0_0_20px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)]"
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
          >
            Começar Agora - 7 dias grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground text-sm space-y-2">
          <p>© 2025 deliverynoazul. Todos os direitos reservados.</p>
          <p>STUDIO SANNBA DESIGN E ARQUITETURA LTDA - ME | CNPJ: 61.949.360/0001-29</p>
        </div>
      </footer>

      {/* Watermark Logo */}
      <img 
        src="/logo.png" 
        alt="" 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] max-w-[90vw] opacity-[0.03] pointer-events-none"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};

export default Landing;