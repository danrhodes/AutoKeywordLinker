import esbuild from "esbuild";
import process from "process";
import fs from "fs";

const banner = `/*
THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY.
Edit files in src/ and run 'npm run build'
*/
`;

const prod = process.argv[2] === "production";

// Backup original main.js if it exists and hasn't been backed up
const mainJsPath = "main.js";
const backupPath = "main.js.original";

if (fs.existsSync(mainJsPath) && !fs.existsSync(backupPath)) {
    console.log("Backing up original main.js to main.js.original");
    fs.copyFileSync(mainJsPath, backupPath);
}

const context = await esbuild.context({
    banner: {
        js: banner,
    },
    entryPoints: ["src/main-source.js"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
    ],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    outfile: "main.js",
    minify: prod,
});

if (prod) {
    await context.rebuild();
    process.exit(0);
} else {
    await context.watch();
    console.log("Watching for changes...");
}
