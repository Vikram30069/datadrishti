import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paytm: {
          cyan: "#00BAF2",
          cyanHover: "#0099C7",
          darkblue: "#0F4A8A",
          navy: "#03254C",
          surface: "#F5F8FA",
          darkbg: "#0B1528",
          cardbg: "#112240",
          border: "#1E3A8A",
        },
      },
      boxShadow: {
        'phone': '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 12px #1e293b, 0 0 0 14px #334155',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
};
export default config;
