# Search benchmark

Este benchmark mede a latência de pesquisa no Elasticsearch.

O runner (`SearchBenchmarkRunner`) usa o profile `benchmark`, cria dados de teste em memória, indexa-os no Elasticsearch e depois executa warmup e medições reais, imprimindo média, p50 (mediana), p95 (percentil 95), mínimo e máximo em milissegundos.

## Pré-requisitos

Arrancar o Elasticsearch:

```bash
docker-compose -f compose/build/docker-compose-runner-local.yml up -d
```

## Executar

A partir da pasta `backend`:

```bash
./gradlew benchmarkSearch
```

No Windows:

```powershell
.\gradlew.bat benchmarkSearch
```

## Configurar o benchmark

Podes alterar os parâmetros com `--args`:

```bash
./gradlew benchmarkSearch --args='--benchmark.rows=20000 --benchmark.iterations=200 --benchmark.warmup=20 --benchmark.query="sustainable development"'
```

Parâmetros disponíveis:

| Parâmetro              |                   Default | Descrição                                                                        |
| ---------------------- | ------------------------: | -------------------------------------------------------------------------------- |
| `benchmark.query`      | `sustainable development` | Texto pesquisado no Elasticsearch                                                |
| `benchmark.rows`       |                    `5000` | Número de teses sintéticas criadas em memória e indexadas                        |
| `benchmark.page`       |                       `1` | Página pedida na pesquisa                                                        |
| `benchmark.size`       |                      `10` | Tamanho da página pedida                                                         |
| `benchmark.warmup`     |                      `10` | Iterações descartadas antes da medição                                           |
| `benchmark.iterations` |                     `100` | Iterações medidas                                                                |
| `benchmark.index`      |                    `true` | Se deve indexar dados no Elasticsearch antes da medição                          |
| `benchmark.cleanup`    |                    `true` | Se deve apagar documentos antigos do benchmark antes da execução e limpar no fim |

## Notas importantes

* O benchmark usa UUIDs determinísticos, por isso execuções repetidas não criam documentos duplicados no Elasticsearch.
* Os dados sintéticos são criados em memória e indexados diretamente no Elasticsearch.
* O benchmark não insere dados no PostgreSQL.
* A medição é feita ao nível da aplicação, através do repositório Elasticsearch usado pelo backend.
* Para resultados mais estáveis, corra o benchmark mais do que uma vez e ignore a primeira execução, porque Elasticsearch e JVM podem ainda estar "frios".

## Cleanup

O runner apaga documentos antigos do benchmark antes da execução e limpa também no fim, se `benchmark.cleanup=true`.

No Elasticsearch, os documentos benchmark são apagados explicitamente pelo ID determinístico de cada tese.
