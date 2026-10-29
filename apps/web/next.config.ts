import type { NextConfig } from "next";

/**
 * A fully static site: every page is exported as a file to `out/`, so it can be hosted on
 * GitHub Pages (or any static host) with no server and no database. All learner data stays
 * in the browser.
 *
 * PAGES_BASE_PATH is the sub-path the site lives under, e.g. "/Language-Learning" for
 * https://szgm770.github.io/Language-Learning/. Empty for local runs and custom domains.
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  transpilePackages: ["@lingo/content-schema", "@lingo/engine", "@lingo/sync"],
};

export default nextConfig;
