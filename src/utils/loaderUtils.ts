export function getLoaderEnv(): {
  baseDir: string;
  ext: string;
  useTs: boolean;
} {
  const useTs: boolean = process.env.FORCE_TS === "true";

  const baseDir: string = useTs
    ? "src"
    : process.env.NODE_ENV === "production"
      ? "dist"
      : "src";

  const ext: string = useTs
    ? "ts"
    : process.env.NODE_ENV === "production"
      ? "js"
      : "ts";

  return { baseDir, ext, useTs };
}
