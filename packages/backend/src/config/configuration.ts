export const configuration = () => {
  console.log('process.env.CONTENT_FOLDER', process.env.CONTENT_FOLDER);
  return {
    contentFolder: process.env.CONTENT_FOLDER,
  } as const;
};

export type TConfiguration = ReturnType<typeof configuration>;
