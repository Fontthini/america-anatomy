export type Status = "ativo" | "pendente" | "cancelado" | "rascunho";
export type Row = {
  id: string;
  client: string;
  email: string;
  status: Status;
  amount: number;
  date: string;
};

const names = [
  "Aurora Lima", "Bento Cardoso", "Clara Antunes", "Davi Reis",
  "Eva Tavares", "Felipe Souto", "Gabriela Pires", "Henrique Vaz",
  "Iris Moura", "João Bernardes", "Kael Ribeiro", "Lia Macedo",
  "Murilo Sales", "Nina Holanda", "Otavio Brandão", "Paula Drummond",
  "Quintino Faria", "Rafa Tinoco", "Sofia Bittencourt", "Tomás Vieira",
  "Ursa Martins", "Vinicius Cano", "Wallace Drumond", "Xavier Lobo", "Yara Pinto",
];
const statuses: Status[] = ["ativo", "pendente", "cancelado", "rascunho"];

export const tableRows: Row[] = names.map((n, i) => ({
  id: "INV-" + String(1000 + i),
  client: n,
  email: n.toLowerCase().replace(/\s+/g, ".") + "@exemplo.com",
  status: statuses[i % statuses.length],
  amount: 240 + ((i * 137) % 4800),
  date: new Date(2025, i % 12, 1 + ((i * 3) % 27)).toISOString(),
}));