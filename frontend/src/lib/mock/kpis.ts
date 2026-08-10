export type Kpi = {
  label: string;
  value: string;
  delta: number;
  hint: string;
};

export const kpis: Kpi[] = [
  { label: "Receita recorrente", value: "R$ 184,2k", delta: 12.4, hint: "vs. mês anterior" },
  { label: "Novos clientes", value: "1.284", delta: 4.1, hint: "últimos 30 dias" },
  { label: "Taxa de conversão", value: "3,42%", delta: -0.6, hint: "média móvel 7d" },
  { label: "Churn", value: "1,18%", delta: -0.2, hint: "trimestre atual" },
];