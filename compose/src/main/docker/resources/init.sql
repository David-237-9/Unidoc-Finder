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
    university_id UUID,
    FOREIGN KEY (university_id) REFERENCES university (id)
);

INSERT INTO university (name, repo_url) VALUES
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
