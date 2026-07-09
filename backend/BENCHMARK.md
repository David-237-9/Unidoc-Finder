# Search benchmark

Este benchmark compara a latência da mesma pesquisa no PostgreSQL e no Elasticsearch.

O runner (SearchBenchmarkRunner) usa o profile `benchmark`, cria dados de teste, guarda-os no base de dados e indexa-os no Elasticsearch. Depois executa warmup e medições reais, imprimindo média, p50 (mediana), p95 (percentil 95), mínimo e máximo em milissegundos.

## Pré-requisitos

Arrancar os serviços de PostgreSQL e Elasticsearch:

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

| Parâmetro | Default | Descrição                                                                                                                                     |
| --- | ---: |-----------------------------------------------------------------------------------------------------------------------------------------------|
| `benchmark.query` | `sustainable development` | Texto pesquisado nos dois motores                                                                                                             |
| `benchmark.rows` | `5000` | Número de teses sintéticas criadas/indexadas                                                                                                  |
| `benchmark.page` | `1` | Página pedida na pesquisa                                                                                                                     |
| `benchmark.size` | `10` | Tamanho da página pedida                                                                                                                      |
| `benchmark.warmup` | `10` | Iterações descartadas antes da medição                                                                                                        |
| `benchmark.iterations` | `100` | Iterações medidas                                                                                                                             |
| `benchmark.seed` | `true` | Se deve inserir/atualizar dados no PostgreSQL                                                                                                 |
| `benchmark.index` | `true` | Se deve indexar dados no Elasticsearch                                                                                                        |
| `benchmark.cleanup` | `true` | Se deve apagar dados antigos antes da execução e limpar no fim; as teses PostgreSQL são removidas por cascade ao apagar a universidade criada |

## Notas importantes

- O benchmark usa UUIDs determinísticos, por isso execuções repetidas não criam dados duplicados.
- A comparação é de latência da aplicação, não um benchmark puro do engine.
- Para resultados mais estáveis, corre o benchmark mais do que uma vez e ignora a primeira execução, porque Elasticsearch/JVM/DB podem ainda estar frios.
- O SQL atual do backend usa `ILIKE '%query%'` em `title` e `abstract`. Sem índice trigram/full-text no PostgreSQL, esta abordagem tende a fazer sequential scan em datasets maiores.

## Cleanup

O runner apaga os dados de benchmarks antigos antes da execução e limpa também no fim.
No PostgreSQL, apaga a universidade benchmark com `universityRepository.deleteById(...)`.
As teses associadas são apagadas automaticamente, pois a foreign key `thesis.university_id` tem `ON DELETE CASCADE`.
No Elasticsearch, os documentos benchmark são apagados explicitamente pelo ID determinístico de cada tese.
