const apiUrl = process.env.THESIS_API_URL || "http://localhost:8080"

/**
 * Fetches the list of repositories from the API.
 * @return {Promise<Array>} A promise that resolves to an array of repository objects.
 */
async function fetchRepositories () {
    const page = 1
    const size = 100
    const url = `${apiUrl}/api/universities?page=${page}&size=${size}`

    console.log(`Fetching repositories from ${url}...`)
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
    })

    if (!response.ok) throw new Error('Failed fetching repositories: ' + response.statusText)

    return await response.json()
}

export const REPOSITORIES = await fetchRepositories() // use OLD_REPOSITORIES for debuggind

const OLD_REPOSITORIES = [
    { // Done
        id: "f2a7155a-d641-4bf9-ab68-98ef08f6d65a",
        name: "Instituto Politécnico de Lisboa",
        repoUrl: "https://repositorio.ipl.pt/server/oai/openaire4",
    },
    { // Check
        id: "6bf9fd27-a906-480a-874b-911033ea60b4",
        name: "Universidade de Lisboa",
        repoUrl: "https://repositorio.ulisboa.pt/server/oai/openaire4",
    },
    { // Done
        id: "88b8d94b-ca59-4a3d-87d1-53b259c625f4",
        name: "Universidade Nova de Lisboa",
        repoUrl: "https://run.unl.pt/server/oai/request"
    },
    { // Done
        id: "fb309d07-b699-4a02-aab6-bb9ca24764e8",
        name: "Universidade do Minho",
        repoUrl: "https://repositorium.sdum.uminho.pt/oai/request"
    },
    { // Done
        id: "ac106971-8669-4fe5-9604-1d0c27c8d3f3",
        name: "Universidade do Porto",
        repoUrl: "https://repositorio-aberto.up.pt/oai/request"
    },
    { // Check
        id: "28ed6b49-77c7-40af-91d4-6a2e13116be5",
        name: "Universidade de Coimbra",
        repoUrl: "https://estudogeral.sib.uc.pt/oai/rcaap",
    },
    { // Check (fail sometimes)
        id: "bc476560-4c36-4e75-a936-bc86118e9867",
        name: "Universidade de Aveiro",
        repoUrl: "https://ria.ua.pt/oai/request"
    },
    { // Done
        id: "373e335a-6e4e-473b-bff7-b868cf907ca8",
        name: "Universidade da Beira Interior",
        repoUrl: "https://ubibliorum.ubi.pt/server/oai/request"
    },
    { // Done
        id: "ba6e410a-4cfd-42ed-9721-7215e6ec96c3",
        name: "Universidade do Algarve",
        repoUrl: "https://sapientia.ualg.pt/server/oai/request"
    },
    { // Done
        id: "5eec0ace-cec6-423a-bd50-8eee26f7b103",
        name: "Universidade de Évora",
        repoUrl: "https://dspace.uevora.pt/rdpc-oaiextended/request"
    },
    { // Done
        id: "73734400-a587-4c7b-906a-15e1bc84eb80",
        name: "Universidade de Trás-os-Montes e Alto Douro",
        repoUrl: "https://repositorio.utad.pt/oai/request"
    },
    { // Check (fail sometimes)
        id: "a55e631b-e351-4a71-af55-e59b0feb0c13",
        name: "Universidade dos Açores",
        repoUrl: "https://repositorio.uac.pt/server/oai/openaire4",
    },
    { // Done
        id: "9cbd25cb-d995-4f56-971f-4be501fa0ae0",
        name: "Universidade da Madeira",
        repoUrl: "https://digituma.uma.pt/server/oai/request"
    },
    { // Done
        id: "187146ba-02a7-4756-9407-351dc05f373d",
        name: "Universidade Aberta",
        repoUrl: "https://repositorioaberto.uab.pt/server/oai/request"
    },
    { // Done
        id: "54abac47-f8d7-41fc-9d5b-e3e8c714765d",
        name: "ISCTE - Instituto Universitário de Lisboa",
        repoUrl: "https://repositorio.iscte-iul.pt/oai/request"
    },
]
