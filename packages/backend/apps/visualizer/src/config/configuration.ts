export const configuration = () => {
  return {
    contentFolder: process.env.CONTENT_FOLDER,
    appPort: Number.isFinite(Number(process.env.APP_PORT))
      ? Number(process.env.APP_PORT)
      : 3000,
  } as const;
};

export type TConfiguration = ReturnType<typeof configuration>;
