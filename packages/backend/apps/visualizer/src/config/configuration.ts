export const configuration = () => {
  return {
    appPort: Number.isFinite(Number(process.env.APP_PORT))
      ? Number(process.env.APP_PORT)
      : 3002,
  } as const;
};

export type TConfiguration = ReturnType<typeof configuration>;
