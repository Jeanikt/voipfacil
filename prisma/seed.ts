// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.auditLog.deleteMany();
  await prisma.call.deleteMany();
  await prisma.billing.deleteMany();
  await prisma.trunk.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.provider.deleteMany();

  // Popular provedores VoIP brasileiros
  const providers = [
    {
      name: 'Directcall',
      plan: 'SIP Trunk Ilimitado',
      precoMensal: 60.16,
      tarifaFixo: 0.08,
      tarifaMovel: 0.12,
      canais: 10,
      link: 'https://directcall.com.br/sip-trunk',
      features: ['Chamadas ilimitadas', '10 canais simultâneos', 'Suporte 24/7'],
      rating: 4.5,
      reviews: 150,
    },
    {
      name: 'Directcall',
      plan: '0800 IP Ilimitado',
      precoMensal: 220.72,
      tarifaFixo: 0.06,
      tarifaMovel: 0.1,
      canais: 20,
      link: 'https://directcall.com.br/0800',
      features: ['0800 ilimitado', '20 canais simultâneos', 'URA avançada'],
      rating: 4.3,
      reviews: 89,
    },
    {
      name: 'Directcall',
      plan: '3CX PBX IP na Nuvem',
      precoMensal: 99.8,
      tarifaFixo: 0.07,
      tarifaMovel: 0.11,
      canais: 15,
      link: 'https://directcall.com.br/3cx',
      features: ['PBX na nuvem', '15 canais', 'Integração total'],
      rating: 4.7,
      reviews: 203,
    },
    {
      name: 'VoipMundo',
      plan: 'SIP Trunk Premium',
      precoMensal: 45.9,
      tarifaFixo: 0.09,
      tarifaMovel: 0.14,
      canais: 8,
      link: 'https://voipmundo.com.br/sip-trunk',
      features: ['8 canais', 'Qualidade HD', 'Suporte técnico'],
      rating: 4.2,
      reviews: 76,
    },
    {
      name: 'Vox Telecom',
      plan: 'SIP Trunk Empresarial',
      precoMensal: 75.0,
      tarifaFixo: 0.065,
      tarifaMovel: 0.105,
      canais: 12,
      link: 'https://voxtelecom.com.br/sip-trunk',
      features: ['12 canais', 'Relatórios detalhados', 'API REST'],
      rating: 4.4,
      reviews: 112,
    },
    {
      name: 'Diskfree',
      plan: 'Tronco 30 Canais Ilimitado',
      precoMensal: 99.0,
      tarifaFixo: 0.055,
      tarifaMovel: 0.095,
      canais: 30,
      link: 'https://diskfree.com.br/tronco-sip',
      features: ['Ilimitado nacional', '30 canais', 'Wholesale'],
      rating: 4.6,
      reviews: 134,
    },
    {
      name: 'FaleVono',
      plan: 'SIP Trunk Básico',
      precoMensal: 30.0,
      tarifaFixo: 0.055,
      tarifaMovel: 0.186,
      canais: 5,
      link: 'https://falevono.com.br/sip-trunk',
      features: ['5 canais', 'Setup grátis', 'Corporativo'],
      rating: 4.1,
      reviews: 67,
    },
  ];

  for (const providerData of providers) {
    await prisma.provider.upsert({
      where: {
        name_plan: {
          name: providerData.name,
          plan: providerData.plan,
        },
      },
      update: providerData,
      create: providerData,
    });
  }

  // Criar usuário de demonstração
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@voipfacil.com.br',
      name: 'Usuário Demonstração',
      apiKey: 'vf_demo_' + Math.random().toString(36).substring(2, 15),
      lgpdConsent: true,
      lgpdConsentDate: new Date(),
    },
  });

  // Criar tronco de demonstração
  await prisma.trunk.create({
    data: {
      userId: demoUser.id,
      name: 'Tronco Demo Directcall',
      sipUri: 'sip.demo@directcall.com.br',
      sipUsername: 'demo_user',
      sipPassword: 'demo_password',
      provider: 'Directcall',
      isPrimary: true,
      maxChannels: 5,
      isActive: true,
    },
  });

  console.log('✅ Seed completado com sucesso!');
  console.log('👤 Usuário demo criado:', demoUser.email);
  console.log('🔑 API Key:', demoUser.apiKey);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
