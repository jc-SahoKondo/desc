# OpenAPI Generator 

## Springコード生成

```[bash]
openapi-generator-cli generate \
  -i openapi.yml \
  -g spring \
  -t ./templates/JavaSpring \
  -o ./spring-server

```

## tsコード生成

```[bash]
openapi-generator-cli generate \
  -i openapi.yml \
  -g typescript-fetch \
  -o ./ts-client

```

## html出力

```[bash]
openapi-generator-cli generate -i openapi.yml -g html -o ./docs

```

