module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    { name: "no-orphans", severity: "error", from: { orphan: true, pathNot: ["\\.d\\.ts$", "main\\.ts$"] }, to: {} },
    { name: "rules-stay-pure", severity: "error", from: { path: "^src/rules" }, to: { path: "^src/(?!rules/)" } },
    { name: "no-phaser-in-rules", severity: "error", from: { path: "^src/rules" }, to: { path: "^node_modules/phaser" } },
    { name: "rules-import-only-rules", severity: "error", from: { path: "^src/rules/" }, to: { pathNot: ["^src/rules/", "^node_modules/vitest/"] } },
    { name: "options-import-only-options", severity: "error", from: { path: "^src/options/" }, to: { pathNot: ["^src/options/", "^node_modules/vitest/"] } },
    { name: "phaser-only-in-scenes", severity: "error", from: { path: "^src/", pathNot: "^src/scenes/" }, to: { path: "^node_modules/phaser" } },
    { name: "scenes-import-only-rules-phaser-and-assets", severity: "error", from: { path: "^src/scenes/" }, to: { pathNot: ["^src/scenes/", "^src/rules/index\\.ts$", "^node_modules/phaser/", "^assets/[^/]+\\.png$"] } },
    { name: "options-are-read-only-at-boot", severity: "error", from: { path: "^src/", pathNot: ["^src/main\\.ts$", "^src/options/"] }, to: { path: "^src/options/" } },
    { name: "nothing-imports-main", severity: "error", from: {}, to: { path: "^src/main\\.ts$" } },
    { name: "vitest-only-in-tests", severity: "error", from: { pathNot: "\\.test\\.ts$" }, to: { path: "^node_modules/vitest/" } },
    { name: "no-test-imports-from-prod", severity: "error", from: { pathNot: "\\.test\\.ts$" }, to: { path: "\\.test\\.ts$" } },
    { name: "modules-are-entered-through-index", severity: "error", from: { path: "^src/([^/]+)/" }, to: { path: "^src/(?!$1/)[^/]+/.+", pathNot: "^src/[^/]+/index\\.ts$" } },
    { name: "top-level-enters-modules-through-index", severity: "error", from: { path: "^src/[^/]+\\.ts$" }, to: { path: "^src/[^/]+/.+", pathNot: "^src/[^/]+/index\\.ts$" } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.app.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default"] },
  },
};
