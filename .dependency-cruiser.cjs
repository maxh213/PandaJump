module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    { name: "no-orphans", severity: "error", from: { orphan: true, pathNot: ["\\.d\\.ts$", "main\\.ts$"] }, to: {} },
    { name: "rules-stay-pure", severity: "error", from: { path: "^src/rules" }, to: { path: "^src/(?!rules/)" } },
    { name: "no-phaser-in-rules", severity: "error", from: { path: "^src/rules" }, to: { path: "^node_modules/phaser" } },
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
