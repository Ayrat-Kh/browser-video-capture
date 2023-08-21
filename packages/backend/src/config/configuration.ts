export const configuration = () => {
  return {
    contentFolder: process.env.CONTENT_FOLDER,
  } as const;
};

export type TConfiguration = ReturnType<typeof configuration>;
