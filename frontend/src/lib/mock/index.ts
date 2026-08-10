export const mockDelay = (ms = 700) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));