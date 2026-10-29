/**
 * The site may live under a sub-path, e.g. https://user.github.io/Language-Learning/.
 * next/link adds it automatically; plain fetch(), location and service-worker URLs need this.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => `${BASE_PATH}${path}`;
