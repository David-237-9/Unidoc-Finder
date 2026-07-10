CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS university (
    id UUID PRIMARY KEY DEFAULT  gen_random_uuid(),
    name TEXT NOT NULL,
    repo_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS thesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    abstract TEXT,
    year INT,
    url TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    subjects TEXT[] NOT NULL DEFAULT '{}',
    type TEXT NOT NULL,
    language TEXT NOT NULL,
    file_url TEXT,
    hash TEXT,
    university_id UUID,
    FOREIGN KEY (university_id) REFERENCES university (id) ON DELETE CASCADE
);

-- Update already existing table
ALTER TABLE thesis ADD COLUMN IF NOT EXISTS hash TEXT;
-- Update already existing table
UPDATE thesis
SET hash = encode(
        digest(
                convert_to(
                        COALESCE(
                                NULLIF(url, ''),
                                NULLIF(file_url, ''),
                                COALESCE(title, 'null') || '|' ||
                                COALESCE(array_to_string(authors, ','), '') || '|' ||
                                COALESCE(year::TEXT, 'null')
                        ),
                        'UTF8'
                ),
                'sha1'
        ),
        'hex'
           )
WHERE hash IS NULL OR hash = '';

CREATE UNIQUE INDEX IF NOT EXISTS thesis_hash_idx ON thesis(hash) WHERE hash IS NOT NULL AND hash <> '';

INSERT INTO university (name, repo_url) VALUES
    ('Instituto Politécnico de Lisboa', 'https://repositorio.ipl.pt/server/oai/request'),
    ('Universidade de Lisboa', 'https://repositorio.ul.pt/server/oai/request'),
    ('Universidade Nova de Lisboa', 'https://run.unl.pt/server/oai/request'),
    ('Universidade do Minho', 'https://repositorium.sdum.uminho.pt/oai/request'),
    ('Universidade do Porto', 'https://repositorio-aberto.up.pt/oai/request'),
    ('Universidade de Coimbra', 'https://estudogeral.uc.pt/oai/request'),
    ('Universidade de Aveiro', 'https://ria.ua.pt/oai/request'),
    ('Universidade da Beira Interior', 'https://ubibliorum.ubi.pt/server/oai/request'),
    ('Universidade do Algarve', 'https://sapientia.ualg.pt/server/oai/request'),
    ('Universidade de Évora', 'https://dspace.uevora.pt/server/rdpc/oai/request'),
    ('Universidade de Trás-os-Montes e Alto Douro', 'https://repositorio.utad.pt/oai/request'),
    ('Universidade dos Açores', 'https://repositorio.uac.pt/server/oai/request'),
    ('Universidade da Madeira', 'https://digituma.uma.pt/server/oai/request'),
    ('Universidade Aberta', 'https://repositorioaberto.uab.pt/server/oai/request'),
    ('ISCTE - Instituto Universitário de Lisboa', 'https://repositorio.iscte-iul.pt/oai/request');
