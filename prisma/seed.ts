import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpa dados existentes
  await prisma.provider.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log("✅ Dados antigos limpos");

  // ============================================
  // PROVEDORES BRASILEIROS - Planos Directcall
  // ============================================

  const directcallPlans = [
    // PORTABILIDADE E NÚMEROS VIRTUAIS
    {
      name: "Directcall",
      plan: "Portabilidade Telefônica",
      precoMensal: 0.0, // Sob consulta
      tarifaFixo: 0.061,
      tarifaMovel: 0.256,
      canais: 5,
      link: "https://directcall.com.br/produtos/portabilidade-telefonica",
      features: [
        "Portabilidade grátis",
        "Atenda fixo no celular/PC",
        "Gravação de chamadas",
        "URA na nuvem",
        "Todos os DDDs do Brasil",
      ],
      rating: 4.8,
      reviews: 250,
    },
    {
      name: "Directcall",
      plan: "Número Fixo Virtual (DID)",
      precoMensal: 25.0,
      tarifaFixo: 0.061,
      tarifaMovel: 0.256,
      canais: 3,
      link: "https://directcall.com.br/produtos/numero-fixo-virtual",
      features: [
        "Número local em qualquer DDD",
        "Sem endereço físico",
        "Atende no celular",
        "Teste grátis",
        "Mobilidade total",
      ],
      rating: 4.7,
      reviews: 180,
    },

    // SIP TRUNK
    {
      name: "Directcall",
      plan: "SIP Trunk Ilimitado",
      precoMensal: 60.16,
      tarifaFixo: 0.0, // Ilimitado
      tarifaMovel: 0.0, // Ilimitado
      canais: 10,
      link: "https://directcall.com.br/produtos/sip-trunk-ilimitado",
      features: [
        "Ligações ilimitadas fixo e móvel",
        "Custo mensal fixo",
        "Ideal para escritórios",
        "Gravação e URA",
        "Teste grátis",
      ],
      rating: 4.9,
      reviews: 320,
    },
    {
      name: "Directcall",
      plan: "SIP Trunk Atacado",
      precoMensal: 0.0, // Sob consulta
      tarifaFixo: 0.045, // Tarifa atacado
      tarifaMovel: 0.18, // Tarifa atacado
      canais: 100,
      link: "https://directcall.com.br/produtos/sip-trunk-atacado",
      features: [
        "Tarifas de atacado",
        "Stir/Shaken (Chamada Verificada)",
        "Integração com CRM",
        "APIs de telefonia",
        "Callcenter IP",
        "Suporte especializado",
      ],
      rating: 5.0,
      reviews: 450,
    },

    // 0800
    {
      name: "Directcall",
      plan: "0800 IP Ilimitado",
      precoMensal: 220.72,
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 5,
      link: "https://directcall.com.br/produtos/0800-ip-ilimitado",
      features: [
        "0800 novo ou portabilidade",
        "Custo mensal fixo",
        "Ilimitado nacional",
        "Gravação até 5 anos",
        "URA na nuvem",
        "PMEs",
      ],
      rating: 4.8,
      reviews: 190,
    },
    {
      name: "Directcall",
      plan: "0800 IP Atacado",
      precoMensal: 0.0, // Sob consulta
      tarifaFixo: 0.035, // Atacado
      tarifaMovel: 0.15, // Atacado
      canais: 200,
      link: "https://directcall.com.br/produtos/0800-ip-atacado",
      features: [
        "URAs inteligentes + CRM",
        "Gravação até 5 anos",
        "Callcenter IP",
        "Distribuição inteligente",
        "APIs de telefonia",
        "Transcrição IA (em breve)",
      ],
      rating: 4.9,
      reviews: 280,
    },

    // NÚMERO ÚNICO NACIONAL
    {
      name: "Directcall",
      plan: "Número Único Nacional (NUN)",
      precoMensal: 0.0, // Sob consulta
      tarifaFixo: 0.055,
      tarifaMovel: 0.22,
      canais: 50,
      link: "https://directcall.com.br/produtos/numero-unico-nacional",
      features: [
        "Números 400X e 300X",
        "Cobertura nacional",
        "Ideal para bancos",
        "Via SIP",
        "Alta disponibilidade",
      ],
      rating: 5.0,
      reviews: 95,
    },

    // WHATSAPP BUSINESS
    {
      name: "Directcall",
      plan: "Número para WhatsApp",
      precoMensal: 30.0,
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 1,
      link: "https://directcall.com.br/produtos/numero-para-whatsapp",
      features: [
        "Fixo ou 0800 para WhatsApp",
        "Profissionalização",
        "Via SIP sem instalações",
        "Separa pessoal de profissional",
        "Centraliza departamentos",
      ],
      rating: 4.6,
      reviews: 150,
    },

    // 3CX PBX IP
    {
      name: "Directcall",
      plan: "3CX PBX IP na Nuvem",
      precoMensal: 99.8,
      tarifaFixo: 0.0, // Incluso ilimitado
      tarifaMovel: 0.0, // Incluso ilimitado
      canais: 40,
      link: "https://directcall.com.br/produtos/3cx-pbx-ip-nuvem",
      features: [
        "Até 40 ramais",
        "Ilimitado nacional incluso",
        "URA + Filas + Correio de voz",
        "Chat + Videoconferência",
        "Rápida instalação",
        "Teste grátis",
      ],
      rating: 4.9,
      reviews: 410,
    },
    {
      name: "Directcall",
      plan: "3CX PBX IP Hospedado",
      precoMensal: 0.0, // Sob consulta
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 999, // Ilimitado
      link: "https://directcall.com.br/produtos/3cx-pbx-ip-hospedado",
      features: [
        "Ramais ilimitados",
        "Callcenter IP completo",
        "Alta disponibilidade",
        "Médias e grandes empresas",
        "600k+ clientes",
        "Líder mundial",
      ],
      rating: 5.0,
      reviews: 620,
    },

    // FEATURES AVANÇADAS
    {
      name: "Directcall",
      plan: "URA Avançada + Auditoria",
      precoMensal: 150.0,
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 10,
      link: "https://directcall.com.br/produtos/ura-avancada",
      features: [
        "Integração com CRM",
        "Validação por CNPJ",
        "Protocolo de atendimento",
        "Status de pedido",
        "24/7 automático",
        "Reduz tempo de espera",
      ],
      rating: 4.7,
      reviews: 130,
    },
    {
      name: "Directcall",
      plan: "Gravação de Chamadas (5 anos)",
      precoMensal: 80.0,
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 5,
      link: "https://directcall.com.br/produtos/gravacao-chamadas",
      features: [
        "Busca e reprodução fácil",
        "Retenção até 5 anos",
        "Painel multi-plataforma",
        "LGPD compliant",
        "Treinamento de equipes",
        "Resolução de disputas",
      ],
      rating: 4.8,
      reviews: 210,
    },
    {
      name: "Directcall",
      plan: "Chamada Verificada (Stir/Shaken)",
      precoMensal: 200.0,
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 20,
      link: "https://directcall.com.br/produtos/chamada-verificada",
      features: [
        "Nome e logo no celular",
        "Aumenta atendimento em 40%",
        "Combate spam",
        "Reforça credibilidade",
        "Ideal para vendas",
        "Tecnologia avançada",
      ],
      rating: 5.0,
      reviews: 175,
    },

    // INTEGRAÇÕES
    {
      name: "Directcall",
      plan: "Integração com Microsoft Teams",
      precoMensal: 120.0,
      tarifaFixo: 0.0, // Incluso ilimitado
      tarifaMovel: 0.0, // Incluso ilimitado
      canais: 30,
      link: "https://directcall.com.br/produtos/integracao-teams",
      features: [
        "Atenda fixo no Teams",
        "Ligações ilimitadas",
        "Ramal completo no Teams",
        "URA e gravação",
        "Trabalho remoto",
        "Unifica comunicação",
      ],
      rating: 4.8,
      reviews: 165,
    },
    {
      name: "Directcall",
      plan: "APIs de Voz, IA e SMS",
      precoMensal: 0.0, // Sob consulta
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 50,
      link: "https://directcall.com.br/produtos/apis-voz-ia-sms",
      features: [
        "Click to Call",
        "Form to Call",
        "Histórico de chamadas no CRM",
        "Transcrição IA",
        "Ouvir gravações (5 anos)",
        "Integração total",
      ],
      rating: 4.9,
      reviews: 230,
    },

    // CLICK TO CALL / FORM TO CALL
    {
      name: "Directcall",
      plan: "Click to Call",
      precoMensal: 50.0,
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 5,
      link: "https://directcall.com.br/produtos/click-to-call",
      features: [
        "Botão no site",
        "Cliente liga com 1 clique",
        "Aumenta conversão",
        "Momento certo da venda",
        "Fácil integração",
        "Lead qualificado",
      ],
      rating: 4.7,
      reviews: 140,
    },
    {
      name: "Directcall",
      plan: "Form to Call",
      precoMensal: 60.0,
      tarifaFixo: 0.0,
      tarifaMovel: 0.0,
      canais: 5,
      link: "https://directcall.com.br/produtos/form-to-call",
      features: [
        "Liga automaticamente após formulário",
        "Liga para vendedor E cliente",
        "Acelera ciclo de vendas",
        "Elimina barreiras",
        "Lead qualificado",
        "Fácil integração",
      ],
      rating: 4.8,
      reviews: 120,
    },
  ];

  // Inserir provedores
  for (const provider of directcallPlans) {
    await prisma.provider.create({ data: provider });
    console.log(`✅ Criado: ${provider.plan}`);
  }

  console.log("");
  console.log("📊 RESUMO DOS PLANOS CRIADOS:");
  console.log(`   Total: ${directcallPlans.length} planos da Directcall`);
  console.log("");
  console.log("🎉 Seed concluído com sucesso!");
  console.log("");
  console.log(
    "💡 DICA: Acesse http://localhost:3000/api/providers/recommendations"
  );
  console.log("   para ver todos os planos disponíveis!");
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
