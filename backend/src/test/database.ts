export const TEST_DATABASE_URL = "postgresql://nodex:nodex@localhost:5433/nodex_test";

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

export function testEnv() {
  return {
    NODE_ENV: "test",
    DATABASE_URL: process.env.DATABASE_URL ?? TEST_DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL ?? TEST_DATABASE_URL,
    SESSION_SECRET: "secreto-de-pruebas-que-no-se-usa-en-produccion",
  };
}

export function assertLocalDatabase(env: Record<string, string>) {
  for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = env[name];
    if (!url || !LOCAL_HOSTS.includes(new URL(url).hostname)) {
      throw new Error("Los tests solo se ejecutan contra la base local de Docker");
    }
  }
}
