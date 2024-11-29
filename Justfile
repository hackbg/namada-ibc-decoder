build-dev:
  wasm-pack build --dev --target web && rm -v pkg/package.json pkg/.gitignore
