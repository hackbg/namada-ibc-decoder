FROM rust:1.79-alpine3.20 as wasm

RUN apk add musl-dev protoc protobuf-dev openssl-dev cmake build-base binaryen
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack

WORKDIR /build/ibc-decoder
COPY ./Cargo.toml ./Cargo.lock .
RUN cat Cargo.toml && mkdir -p src && touch src/lib.rs && cargo fetch
COPY ./src ./src
RUN PATH=$PATH:~/.cargo/bin wasm-pack build --release --target web \
 && rm -rf target

FROM denoland/deno:2.1.2@sha256:0e01839181db7fddd19f8ca6d99a8ea5b99c3b134b9c0b1920ba8202458ff70d
ARG IBC_DECODER_VERSION unknown
ENV IBC_DECODER_VERSION ${IBC_DECODER_VERSION}
ADD deno.json deno.lock deps.ts /
RUN deno cache --import-map=/deno.json --lock=/deno.lock deps.ts
COPY --from=wasm /build/pkg /
ADD ibc-*.ts main.ts /
RUN deno check *.ts
ENTRYPOINT [ "/bin/bash" ]
CMD [ "-c", "deno run --allow-env --allow-net --allow-read=.env,pkg main.ts" ]
