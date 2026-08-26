import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: [
    "ru"
  ],
  extract: {
    input: "src/**/*.{ts,tsx}",
    output: "src/locales/{{language}}/{{namespace}}.json",
    functions: ["_"],
  }
})
