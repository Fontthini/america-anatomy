/**
 * Seed de desenvolvimento.
 * Cria usuários de teste:
 *   Admin:            admin@demo.com
 *   Gerente:          gerente@demo.com   (role MANAGER)
 *   Vendedor:         vendedor@demo.com  (role SALES_REP)
 *   Médico aprovado:  medico@demo.com    (role DOCTOR, approvalStatus APPROVED)
 *   Médico pendente:  pendente@demo.com  (role DOCTOR, approvalStatus PENDING, atribuído ao vendedor)
 *
 * Senha: definida em SEED_DEMO_PASSWORD (.env local) — nunca hardcoded no código,
 * para não deixar credenciais previsíveis documentadas em texto claro no repositório.
 *
 * Executar: npm run seed
 */

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function hash(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  if (process.env["NODE_ENV"] === "production") {
    console.error("❌ Seed de dados demo bloqueado: NODE_ENV=production.");
    process.exit(1);
  }

  const seedPassword = process.env["SEED_DEMO_PASSWORD"];
  if (!seedPassword || seedPassword.length < 12) {
    console.error(
      "❌ Defina SEED_DEMO_PASSWORD no .env (mínimo 12 caracteres) antes de rodar o seed.",
    );
    process.exit(1);
  }
  const passwordHash = await hash(seedPassword);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      id: "u_admin",
      name: "Ana Diretora",
      email: "admin@demo.com",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email} (id: ${admin.id})`);

  const manager = await prisma.user.upsert({
    where: { email: "gerente@demo.com" },
    update: {},
    create: {
      id: "u_gerente",
      name: "Gabriela Gerente",
      email: "gerente@demo.com",
      passwordHash,
      role: "MANAGER",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Gerente: ${manager.email} (id: ${manager.id})`);

  const salesRep = await prisma.user.upsert({
    where: { email: "vendedor@demo.com" },
    update: {},
    create: {
      id: "u_vendedor",
      name: "Vinícius Vendedor",
      email: "vendedor@demo.com",
      passwordHash,
      role: "SALES_REP",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Vendedor: ${salesRep.email} (id: ${salesRep.id})`);

  const approvedDoctor = await prisma.user.upsert({
    where: { email: "medico@demo.com" },
    update: {},
    create: {
      id: "u_medico_ok",
      name: "Dr. Carlos Medeiros",
      email: "medico@demo.com",
      passwordHash,
      role: "DOCTOR",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      doctorProfile: {
        create: {
          crm: "CRM-SP 123456",
          specialty: "Ortopedia",
          clinicName: "Clínica Medeiros",
          city: "São Paulo",
          state: "SP",
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          approvedByUserId: admin.id,
        },
      },
    },
  });
  console.log(`✅ Médico aprovado: ${approvedDoctor.email} (id: ${approvedDoctor.id})`);

  const pendingDoctor = await prisma.user.upsert({
    where: { email: "pendente@demo.com" },
    update: {},
    create: {
      id: "u_medico_pendente",
      name: "Dra. Beatriz Souza",
      email: "pendente@demo.com",
      passwordHash,
      role: "DOCTOR",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      doctorProfile: {
        create: {
          crm: "CRM-RJ 654321",
          specialty: "Dermatologia",
          clinicName: "Souza Estética",
          city: "Rio de Janeiro",
          state: "RJ",
          approvalStatus: "PENDING",
          assignedSalesRepId: salesRep.id,
        },
      },
    },
  });
  console.log(`✅ Médico pendente: ${pendingDoctor.email} (id: ${pendingDoctor.id})`);

  const products: Array<{
    slug: string;
    title: string;
    description: string;
    category: string;
    price: number;
    sku: string;
    stockQty: number;
  }> = [
    {
      slug: "modelo-coluna-vertebral",
      title: "Modelo Anatômico — Coluna Vertebral",
      description: "Peça de alta fidelidade, tamanho real, ideal para consultório e didática.",
      category: "Anatomia Óssea",
      price: 890,
      sku: "AAI-COL-01",
      stockQty: 40,
    },
    {
      slug: "modelo-cranio-didatico",
      title: "Modelo Anatômico — Crânio Didático",
      description: "Crânio desmontável em 8 partes, com numeração das estruturas.",
      category: "Anatomia Óssea",
      price: 650,
      sku: "AAI-CRA-01",
      stockQty: 25,
    },
    {
      slug: "kit-membro-superior",
      title: "Kit Membro Superior Completo",
      description: "Conjunto articulado de ombro, braço, antebraço e mão.",
      category: "Membros",
      price: 1290,
      sku: "AAI-MS-01",
      stockQty: 12,
    },
    {
      slug: "modelo-coracao-seccionado",
      title: "Modelo de Coração Seccionado",
      description: "Duas partes, mostra câmaras internas e grandes vasos.",
      category: "Anatomia Visceral",
      price: 420,
      sku: "AAI-COR-01",
      stockQty: 30,
    },
    {
      slug: "torso-humano-15-partes",
      title: "Torso Humano — 15 Partes",
      description: "Torso completo com órgãos removíveis, base para estudo sistêmico.",
      category: "Anatomia Visceral",
      price: 2190,
      sku: "AAI-TOR-01",
      stockQty: 8,
    },
    {
      slug: "escapepen-neurojoy",
      title: "Escapepen NeuroJoy®",
      description:
        "O gatilho inalável que interrompe o caos e coloca você de volta no comando. 100% natural, sem " +
        "nicotina, sem substâncias tóxicas e sem efeitos colaterais — alívio imediato de tensão, mais foco e " +
        "suporte sensorial contra impulsos. Garantia incondicional de 7 dias.",
      category: "Bem-estar",
      price: 519,
      sku: "AAI-ESCP-01",
      stockQty: 100,
    },
  ];

  for (const p of products) {
    await prisma.catalogItem.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        type: "PRODUCT",
        status: "PUBLISHED",
        title: p.title,
        slug: p.slug,
        description: p.description,
        category: p.category,
        price: p.price,
        sku: p.sku,
        stockQty: p.stockQty,
      },
    });
  }
  console.log(`✅ ${products.length} produtos publicados na Loja`);

  const events: Array<{
    slug: string;
    title: string;
    type: "COURSE" | "SEMINAR";
    description: string;
    daysFromNow: number;
    location: string;
    isOnline: boolean;
    capacity: number;
    price: number;
  }> = [
    {
      slug: "curso-anatomia-aplicada-cirurgia",
      title: "Curso de Anatomia Aplicada à Cirurgia",
      type: "COURSE",
      description: "3 dias de curso presencial com dissecção guiada por especialistas.",
      daysFromNow: 30,
      location: "São Paulo, SP",
      isOnline: false,
      capacity: 20,
      price: 4200,
    },
    {
      slug: "seminario-atualizacao-anatomia-cranial",
      title: "Seminário de Atualização em Anatomia Cranial",
      type: "SEMINAR",
      description: "Encontro de um dia com especialistas convidados, transmissão ao vivo.",
      daysFromNow: 10,
      location: "Online",
      isOnline: true,
      capacity: 100,
      price: 390,
    },
  ];

  for (const e of events) {
    const startsAt = new Date(Date.now() + e.daysFromNow * 86400000);
    await prisma.catalogItem.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        type: e.type,
        status: "PUBLISHED",
        title: e.title,
        slug: e.slug,
        description: e.description,
        startsAt,
        location: e.location,
        isOnline: e.isOnline,
        capacity: e.capacity,
        price: e.price,
      },
    });
  }
  console.log(`✅ ${events.length} cursos/seminários publicados`);

  // Médico aprovado (medico@demo.com) também atua como instrutor do curso demo — permite testar o
  // "Painel do Instrutor" sem precisar criar outro usuário.
  await prisma.catalogItem.update({
    where: { slug: "curso-anatomia-aplicada-cirurgia" },
    data: { instructorUserId: approvedDoctor.id },
  });
  console.log(`✅ ${approvedDoctor.name} definido como instrutor do curso demo`);

  // Catálogo real de cursos — importado de americananatomyinstitute.com (Orlando + Madrid),
  // pra centralizar no sistema os cursos e parceiros que hoje só existem no site institucional.
  const enMonths: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const ptEsMonths: Record<string, number> = {
    janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
    julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
    enero: 0, febrero: 1, marzo: 2, mayo: 4, junio: 5, julio: 6,
    septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };

  function parseFirstDate(text: string): Date | null {
    let m = text.match(/^([A-Za-z]+)\s+\d{1,2}(?:st|nd|rd|th)?.*?,\s*(\d{4})/);
    if (m) {
      const month = enMonths[m[1].toLowerCase()];
      const dayMatch = text.match(/(\d{1,2})/);
      if (month !== undefined && dayMatch) {
        return new Date(Date.UTC(Number(m[2]), month, Number(dayMatch[1]), 12, 0, 0));
      }
    }
    m = text.match(/(\d{1,2}).*?\bde\s+([A-Za-zçãéíóúñ]+)\s+de\s+(\d{4})/i);
    if (m) {
      const monthKey = m[2]
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      const month = ptEsMonths[monthKey];
      if (month !== undefined) {
        return new Date(Date.UTC(Number(m[3]), month, Number(m[1]), 12, 0, 0));
      }
    }
    return null;
  }

  function slugifyLocal(title: string): string {
    return title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const realCourses: Array<{
    title: string;
    instructor: string;
    city: string;
    category: "Corporal" | "Facial";
    dateText: string;
    twoDay?: boolean;
  }> = [
    { title: "Intercorrências em Pós-Operatório de Cirurgia Estética", instructor: "Dr. Alexandre Augusto Gomes", city: "Orlando, FL", category: "Corporal", dateText: "October 18th, 19th and 20th, 2026" },
    { title: "Imersão Prática em Eletroterapia Estética Baseada em Evidências", instructor: "Dr. Maycon Benicio", city: "Orlando, FL", category: "Corporal", dateText: "October 18, 19 and 20, 2026" },
    { title: "Pós-Operatório em Cirurgias Plásticas", instructor: "Dra. Ana Paula Facundo", city: "Orlando, FL", category: "Corporal", dateText: "October 18, 19 and 20, 2026" },
    { title: "Anatomy of Movement Course", instructor: "Prof. Dr. Rogério Wagner, PhD", city: "Orlando, FL", category: "Corporal", dateText: "October 18th, 19th and 20th, 2026" },
    { title: "ASVA Reality American Anatomy", instructor: "Dr. Rodrigo Quadros", city: "Orlando, FL", category: "Corporal", dateText: "October 21, 22 and 23, 2026" },
    { title: "Vencendo a Endometriose — Cirurgia em Bloco", instructor: "Dr. Igor Chiminacio", city: "Orlando, FL", category: "Corporal", dateText: "January 27th, 28th and 29th, 2027" },
    { title: "USA Face Contour", instructor: "Dr. Ana, Eduarda e Dr. Luisa Brum", city: "Orlando, FL", category: "Facial", dateText: "October 18th, 19th and 20th, 2026" },
    { title: "Cirurgias da Face", instructor: "Dr. Marco Rosa", city: "Orlando, FL", category: "Facial", dateText: "October 18th and 19th, 2026", twoDay: true },
    { title: "Applied Anatomy in Fresh Frozen for Medical Interruptions", instructor: "Dra. Jessica Crespi", city: "Orlando, FL", category: "Facial", dateText: "October 18th, 19th and 20th, 2026" },
    { title: "WonderFull Anatomy Experience", instructor: "Dra. Hyllua Husein", city: "Orlando, FL", category: "Facial", dateText: "October 18, 19 and 20, 2026" },
    { title: "Anatomia Aplicada — Planos Anatômicos e Complicações Pós-Operatórias", instructor: "Ana Carolina Pacheco", city: "Madrid, España", category: "Corporal", dateText: "23 y 24 de septiembre de 2026", twoDay: true },
    { title: "Male Augmentation Mastery", instructor: "Dr. Pedro Souza", city: "Madrid, España", category: "Corporal", dateText: "22, 23 e 24 de Setembro de 2026" },
    { title: "Anatomía en Cadáveres Frescos", instructor: "Dr. Carlos Andrés Consoult", city: "Madrid, España", category: "Corporal", dateText: "20, 21 y 22 de septiembre de 2026" },
    { title: "Glúteos & Coxas 3D", instructor: "Dr. Gustavo Camargo", city: "Madrid, España", category: "Corporal", dateText: "22, 23 e 24 de setembro de 2026" },
    { title: "Curso de Anatomia do Movimento (Madrid)", instructor: "Prof. Dr. Rogério Wagner", city: "Madrid, España", category: "Corporal", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Estética Íntima Avançada — Cadaver Lab Experience", instructor: "Dra. Carla Rezende", city: "Madrid, España", category: "Corporal", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Anatomy GS Power", instructor: "Dra. Gleide Sá", city: "Madrid, España", category: "Corporal", dateText: "22, 23 e 24 de setembro de 2026" },
    { title: "Congresso de Anatomia em Fresh Frozen", instructor: "Dra. Renata, Dra. Camila Reis e Dra. Lais Ferro", city: "Madrid, España", category: "Corporal", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Ultra Define Contour 360", instructor: "Dra. Renata Ziegler", city: "Madrid, España", category: "Corporal", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Anatomia Aplicada — Planos Anatômicos e Tecnologias", instructor: "Dra. Marel Gómez", city: "Madrid, España", category: "Corporal", dateText: "23 y 24 de septiembre de 2026", twoDay: true },
    { title: "Treinamento Fresh Frozen Specimen — Turma Viviane Dias", instructor: "Dra. Viviane Dias", city: "Madrid, España", category: "Corporal", dateText: "01, 02 e 03 de março de 2027" },
    { title: "Treinamento Fresh Frozen Specimen — Turma Wendy Mello", instructor: "Dra. Wendy Mello", city: "Madrid, España", category: "Corporal", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Glúteo Anatomy Experience — Método Juliane Proni", instructor: "Dra. Juliane Proni", city: "Madrid, España", category: "Corporal", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Elite Plastic Surgery Training — Madrid", instructor: "Dra. Nicholle Marriê", city: "Madrid, España", category: "Corporal", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Advanced Facial Anatomy: Safe Techniques in HOF", instructor: "Dra. Palmira e Dra. Elaine", city: "Madrid, España", category: "Facial", dateText: "01, 02 e 03 de março de 2027" },
    { title: "Advanced Face Surgery", instructor: "Dr. Diovane Ruaro", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Face Aesthetics Europe — Harmonização Facial e Anatomia", instructor: "Dra. Camilla", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Anatomy & Image — The Real HOF", instructor: "Dra. Caroline Vargas", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Harmonização Premium", instructor: "Dra. Flávia Tobias", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Advanced Face & Neck Anatomy — Fresh & Frozen Cadaver Training", instructor: "Dra. Caroline Tavares", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Full Face: do Planejamento ao Pós-Venda", instructor: "Dra. Lillian Freitas", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Especialização Internacional em Anatomia (Fresh Frozen) — HOF", instructor: "Dra. Nicole Oliveira", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Lifting Face — Tratando o Derretimento da Face", instructor: "Dra. Mileny Ferreira", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "NeoDermaLift Anatomy", instructor: "Dra. Clarissa Dias", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
    { title: "Facial Harmonization Excellence — European Edition", instructor: "Dra. Eduarda Diógenes", city: "Madrid, España", category: "Facial", dateText: "20, 21 e 22 de setembro de 2026" },
  ];

  let importedCount = 0;
  for (const c of realCourses) {
    const startsAt = parseFirstDate(c.dateText);
    if (!startsAt) continue;
    const endsAt = new Date(startsAt.getTime() + (c.twoDay ? 1 : 2) * 86400000);
    const slug = slugifyLocal(`${c.title}-${c.city}`);
    await prisma.catalogItem.upsert({
      where: { slug },
      update: {},
      create: {
        type: "COURSE",
        status: "PUBLISHED",
        title: c.title,
        slug,
        description: `Ministrado por ${c.instructor}. Curso internacional presencial da American Anatomy Institute — teoria + prática em laboratório, com certificação internacional.`,
        category: c.category,
        startsAt,
        endsAt,
        location: c.city,
        isOnline: false,
      },
    });
    importedCount += 1;
  }
  console.log(`✅ ${importedCount} cursos reais importados do site oficial (Orlando + Madrid)`);

  // Banners — imagens reais do site oficial (americananatomyinstitute.com/wp-content/uploads/2025/11/…)
  const bannerSeeds: Array<{
    placement: "LOJA" | "BLOG";
    imageUrl: string;
    title: string;
    subtitle: string;
    order: number;
  }> = [
    {
      placement: "LOJA",
      imageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/ft4-min.jpg",
      title: "American Anatomy Institute",
      subtitle: "Treinamento prático em anatomia com fresh cadavers — Orlando, FL",
      order: 0,
    },
    {
      placement: "LOJA",
      imageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/im3.jpg",
      title: "Peças anatômicas de alta fidelidade",
      subtitle: "Direto para o seu consultório",
      order: 1,
    },
    {
      placement: "LOJA",
      imageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/imj-07.jpg",
      title: "Certificação internacional",
      subtitle: "Teoria + prática em laboratório",
      order: 2,
    },
    {
      placement: "BLOG",
      imageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/ft2-min.jpg",
      title: "Conteúdo científico AAI",
      subtitle: "Artigos, cursos e novidades para médicos parceiros",
      order: 0,
    },
    {
      placement: "BLOG",
      imageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/ft7-min-1.jpg",
      title: "Seminário Internacional de Anatomia",
      subtitle: "Lake Nona Medical City, Orlando",
      order: 1,
    },
  ];

  for (const b of bannerSeeds) {
    const existing = await prisma.banner.findFirst({ where: { placement: b.placement, imageUrl: b.imageUrl } });
    if (!existing) {
      await prisma.banner.create({ data: { ...b, active: true } });
    }
  }
  console.log(`✅ ${bannerSeeds.length} banners (Loja + Blog)`);

  // Artigos científicos — conteúdo real do site oficial (americananatomyinstitute.com)
  const articleSeeds: Array<{
    title: string;
    content: string;
    coverImageUrl: string;
    category: string;
  }> = [
    {
      title: "O American Anatomy Institute (AAI)",
      category: "Institucional",
      coverImageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/ft1-min.jpg",
      content:
        "O American Anatomy Institute (AAI) é uma instituição líder dedicada ao treinamento prático de profissionais " +
        "de saúde e estudantes, com foco em anatomia humana avançada através do estudo de cadáveres frescos, " +
        "preservados sob os mais altos padrões de qualidade.\n\n" +
        "Oferecemos treinamento imersivo para médicos, cirurgiões, cientistas biomédicos, dentistas, enfermeiros, " +
        "professores acadêmicos e residentes — aprimorando habilidades técnicas, acelerando a curva de aprendizado " +
        "e construindo confiança em procedimentos clínicos e cirúrgicos.\n\n" +
        "Nosso ambiente é profissional, seguro e altamente realista, permitindo que os participantes aprendam com " +
        "seus próprios erros sem risco a vidas — promovendo precisão, segurança e excelência na prática da saúde.\n\n" +
        "A missão da AAI é unir teoria e prática através de experiências transformadoras que melhoram o desempenho " +
        "clínico e ajudam a reduzir erros e riscos em todas as áreas do cuidado médico.\n\n" +
        "Sede em Lake Nona, Orlando — um dos maiores polos de inovação médica dos Estados Unidos — a AAI está " +
        "inserida num ecossistema dinâmico de universidades, hospitais e centros de pesquisa de ponta, com " +
        "parcerias estratégicas como AdventHealth – Nicholson Center, Global Family Support Foundation e a " +
        "Universidade Complutense de Madrid.",
    },
    {
      title: "Masterclass: O Corpo Antes da Estética",
      category: "Masterclass",
      coverImageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/1.png",
      content:
        "Durante anos, o mercado ensinou profissionais a tratar flacidez, celulite, edema e gordura localizada. " +
        "Mas quase ninguém ensinou algo muito mais importante: como interpretar o organismo que existe antes de " +
        "qualquer procedimento.\n\n" +
        "O corpo responde ao seu estado biológico: inflamação, funcionamento intestinal, sistema linfático, " +
        "sobrecarga metabólica e equilíbrio fisiológico influenciam diretamente a forma como uma paciente responde " +
        "ao tratamento.\n\n" +
        "O que você vai aprender:\n" +
        "1. O verdadeiro conceito de Terreno Biológico — como o ambiente interno do organismo influencia a resposta " +
        "aos tratamentos estéticos.\n" +
        "2. Como reconhecer sinais de sobrecarga do organismo antes mesmo do procedimento.\n" +
        "3. Sistema linfático além da drenagem — sua importância no equilíbrio do organismo.\n" +
        "4. Os fatores invisíveis que comprometem resultados: inflamação, disbiose, metais pesados, hábitos de vida.\n" +
        "5. Como desenvolver um olhar clínico muito mais estratégico.\n\n" +
        "\"O mercado ensina movimentos. Nós vamos ensinar você a compreender o corpo que responde a esses " +
        "movimentos.\" — Mônica Linhares, especialista em Terapia Manual e fundadora da Body Touch Spa, com mais " +
        "de 10 anos de atuação no mercado americano.",
    },
    {
      title: "Seminário Internacional de Anatomia AAI",
      category: "Eventos",
      coverImageUrl: "https://americananatomyinstitute.com/wp-content/uploads/2025/11/4.png",
      content:
        "O American Anatomy Institute, um dos maiores institutos de anatomia do mundo, em parceria com a Global " +
        "Family Support Foundation, apresenta o International Anatomy Seminar — um evento que combina pesquisa " +
        "científica, educação, descoberta de carreira e propósito.\n\n" +
        "Este seminário exclusivo de 2 dias oferece acesso prático a cadáveres frescos, palestras ao vivo, " +
        "simulações médicas e mentoria científica — tudo em um ambiente seguro, ético e de alta tecnologia, " +
        "localizado no coração do Lake Nona Medical City, em Orlando, nas instalações da AAI em parceria com o " +
        "AdventHealth Nicholson Center.\n\n" +
        "Foco técnico do seminário:\n" +
        "— Cabeça e Pescoço: dissecção craniofacial, cavidade oral, vias aéreas, vasos e nervos.\n" +
        "— Membros Superiores e Inferiores: músculos, tendões, articulações, nervos e vasos.\n" +
        "— Abdômen e Órgãos: dissecção de fígado, intestinos, pâncreas, rins (com simulações de transplante e cirurgia).\n" +
        "— Tórax: coração, pulmões, mediastino e grandes vasos.\n" +
        "— Dorso: músculos dorsais, coluna vertebral e medula espinhal.\n\n" +
        "\"Não ensinamos apenas ciência — ajudamos a moldar vidas, propósitos e carreiras que salvam vidas.\"",
    },
  ];

  for (const a of articleSeeds) {
    const existing = await prisma.article.findFirst({ where: { title: a.title } });
    if (!existing) {
      await prisma.article.create({
        data: {
          title: a.title,
          content: a.content,
          coverImageUrl: a.coverImageUrl,
          category: a.category,
          materials: [],
          published: true,
          publishedAt: new Date(),
        },
      });
    }
  }
  console.log(`✅ ${articleSeeds.length} artigos científicos`);

  // Materiais do curso — vídeo + PDF de exemplo no curso presencial já semeado acima.
  const courseForMaterials = await prisma.catalogItem.findUnique({
    where: { slug: "curso-anatomia-aplicada-cirurgia" },
  });
  if (courseForMaterials) {
    const materialSeeds: Array<{ title: string; type: "VIDEO" | "LINK"; url: string; order: number }> = [
      {
        title: "Aula 1 — Introdução à Anatomia Aplicada",
        type: "VIDEO",
        url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        order: 0,
      },
      {
        title: "Material de apoio do curso",
        type: "LINK",
        url: "https://americananatomyinstitute.com/",
        order: 1,
      },
    ];
    for (const m of materialSeeds) {
      const existing = await prisma.courseMaterial.findFirst({
        where: { catalogItemId: courseForMaterials.id, title: m.title },
      });
      if (!existing) {
        await prisma.courseMaterial.create({ data: { catalogItemId: courseForMaterials.id, ...m } });
      }
    }
    console.log(`✅ ${materialSeeds.length} materiais no curso "${courseForMaterials.title}"`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
