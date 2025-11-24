import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",
        accent: "#14B8A6",
        muted: "#F3F4F6"
      }
    }
  },
  plugins: []
};

export default config;

