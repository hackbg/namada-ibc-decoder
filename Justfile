iter:
  just build-dev
  ./main.ts
build-dev:
  wasm-pack build --dev --target web && rm -v pkg/package.json pkg/.gitignore
check:
  deno check *.ts
lint:
  deno lint *.ts
cloc:
  cloc *.ts
