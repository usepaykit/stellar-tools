export const payment = {
  payment: {
    fields: {
      userId: {
        type: "string",
        required: true,
        references: { model: "user", field: "id" },
      },
      amount: { type: "string", required: true },
      asset: { type: "string", required: true },
      status: { type: "string", required: true },
      transactionHash: { type: "string" },
      stellarMemo: { type: "string" },
    },
  },
} as const;

export const user = {
  user: {
    fields: {
      stellarPublicKey: { type: "string" },
    },
  },
} as const;
