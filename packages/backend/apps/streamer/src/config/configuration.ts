export const configuration = () => {
  return {
    contentFolder: process.env.CONTENT_FOLDER,
    appPort: Number.isFinite(Number(process.env.APP_PORT))
      ? Number(process.env.APP_PORT)
      : 3001,
    imageSocketServerUrl: process.env.IMAGE_SOCKET_SERVER_URL,
  } as const;
};

export type TConfiguration = ReturnType<typeof configuration>;
