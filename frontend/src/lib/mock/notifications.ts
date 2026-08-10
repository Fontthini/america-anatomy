export type Notification = {
  id: string;
  title: string;
  body: string;
  unread: boolean;
  time: string;
};

export const notifications: Notification[] = [
  { id: "n1", title: "Novo cliente", body: "Sofia Bittencourt assinou o plano Pro.", unread: true, time: "há 8 min" },
  { id: "n2", title: "Fatura paga", body: "INV-1023 foi liquidada.", unread: true, time: "há 1 h" },
  { id: "n3", title: "Aviso de churn", body: "3 contas inativas há mais de 30 dias.", unread: false, time: "ontem" },
];