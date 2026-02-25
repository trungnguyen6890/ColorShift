export default [
    {
        ignores: ["node_modules/**", "assets/**"]
    },
    {
        files: ["src/**/*.js", "functions/**/*.js", "scripts/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                "window": "readonly",
                "document": "readonly",
                "console": "readonly",
                "fetch": "readonly",
                "localStorage": "readonly",
                "requestAnimationFrame": "readonly",
                "google": "readonly",
                "Math": "readonly",
                "Date": "readonly",
                "setTimeout": "readonly",
                "clearTimeout": "readonly",
                "setInterval": "readonly",
                "clearInterval": "readonly",
                "navigator": "readonly",
                "Image": "readonly",
                "AudioContext": "readonly",
                "require": "readonly",
                "process": "readonly"
            }
        },
        rules: {
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
            "no-unused-vars": "warn"
        }
    }
];
