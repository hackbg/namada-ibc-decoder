FROM rust:1.77-alpine3.18@sha256:4c640cb99e88d7e7873a25e5dc693999cd4c5a0f486b54362513f80107920ac3 as wasm

RUN apk add musl-dev protoc protobuf-dev openssl-dev cmake build-base binaryen
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack

WORKDIR /build/ibc-decoder
COPY ./Cargo.toml ./Cargo.lock .
RUN cat Cargo.toml && mkdir -p src && touch src/lib.rs && cargo fetch
COPY ./src ./src
RUN PATH=$PATH:~/.cargo/bin wasm-pack build --release --target web \
 && rm -rf target

FROM denoland/deno:2.1.2
ARG IBC_DECODER_VERSION unknown
ENV IBC_DECODER_VERSION ${IBC_DECODER_VERSION}
ADD deno.json deno.lock deps.ts /
RUN deno cache --import-map=/deno.json --lock=/deno.lock deps.ts
COPY --from=wasm /build/pkg /
ADD ibc-*.ts main.ts /
RUN deno check *.ts
ENTRYPOINT [ "/bin/bash" ]
CMD [ "-c", "deno run --allow-env --allow-net --allow-read=.env,pkg main.ts" ]
