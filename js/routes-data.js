/**
 * RoutesDB - Banco de Dados de Rotas e Integração com APIs de Mapa
 * Objeto global responsável por buscar cidades e calcular distâncias reais
 */
const RoutesDB = {
    /**
     * Cache para armazenar coordenadas e locais pesquisados
     * Evita chamadas repetidas à API para a mesma cidade
     */
    placesCache: {},

    /**
     * Busca cidades utilizando a API do Nominatim (OpenStreetMap)
     * Limitado a resultados no Brasil.
     * 
     * @param {string} query - Texto digitado pelo usuário
     * @returns {Promise<Array>} Array de objetos de cidade { name, lat, lon }
     */
    searchCities: async function (query) {
        // Ignora buscas muito curtas para economizar requisições
        if (!query || query.length < 3) return [];

        try {
            // Constrói a URL da API restringindo ao Brasil (countrycodes=br)
            // featuretype=settlement foca em cidades/povoados
            // addressdetails=1 nos ajuda a formatar o nome corretamente
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&addressdetails=1&limit=5&featuretype=settlement`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'pt-BR' // Solicita resultados em português
                }
            });
            const data = await response.json();

            // Formata os resultados para um padrão mais limpo
            return data.map(item => {
                // Tenta encontrar o nome da cidade em vários campos possíveis devolvidos pela API
                const city = item.address.city || item.address.town || item.address.village || item.address.municipality || item.name;
                const state = item.address.state || '';

                // Cria um nome de exibição amigável: "Cidade - Estado"
                const displayName = state ? `${city} - ${state}` : city;

                // Salva no cache para uso futuro (caso o usuário envie o formulário com este nome exato)
                this.placesCache[displayName.toLowerCase()] = {
                    lat: item.lat,
                    lon: item.lon,
                    name: displayName
                };

                return {
                    name: displayName,
                    lat: item.lat,
                    lon: item.lon
                };
            });
        } catch (error) {
            console.error('Erro ao buscar cidades:', error);
            return [];
        }
    },

    /**
     * Obtém as coordenadas de uma cidade (do cache ou via nova busca)
     * Utilizado quando o usuário digita o nome mas não clica na sugestão, 
     * ou para recuperar dados já selecionados.
     * 
     * @param {string} cityName - Nome da cidade formatado
     * @returns {Promise<Object|null>} Objeto de coordenadas {lat, lon} ou null
     */
    getCoordinates: async function (cityName) {
        const normalizedName = cityName.toLowerCase().trim();

        // Verifica se já temos as coordenadas no cache local
        if (this.placesCache[normalizedName]) {
            return this.placesCache[normalizedName];
        }

        // Se não estiver no cache, tenta buscar na API (fallback)
        // Isso cobre casos onde o usuário digita o nome completo sem usar o autocomplete
        try {
            const results = await this.searchCities(cityName);
            if (results && results.length > 0) {
                const bestMatch = results[0];
                // Atualiza o cache com o melhor resultado encontrado
                this.placesCache[normalizedName] = {
                    lat: bestMatch.lat,
                    lon: bestMatch.lon,
                    name: bestMatch.name
                };
                return this.placesCache[normalizedName];
            }
        } catch (error) {
            console.error('Erro na busca de coordenadas (fallback):', error);
        }

        return null;
    },

    /**
     * Calcula a distância de rota de condução entre duas coordenadas usando OSRM
     * 
     * @param {Object} originCoords - Objeto {lat, lon} da origem
     * @param {Object} destCoords - Objeto {lat, lon} do destino
     * @returns {Promise<number|null>} Distância em quilômetros ou null se falhar
     */
    getRouteDistance: async function (originCoords, destCoords) {
        try {
            // API pública do OSRM para rotas de carro. 
            // overview=false deixa a resposta mais leve (sem geometria da rota)
            const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // OSRM retorna distância em metros. Convertemos para km com 1 casa decimal.
                return Math.round((data.routes[0].distance / 1000) * 10) / 10;
            }
        } catch (error) {
            console.error('Erro ao calcular rota OSRM:', error);
        }
        return null;
    },

    /**
     * Método principal para encontrar a distância entre duas cidades
     * Orquestra a busca de coordenadas e o cálculo da rota
     * 
     * @param {string} origin - Nome da cidade de origem
     * @param {string} destination - Nome da cidade de destino
     * @returns {Promise<number|null>} Distância em km se encontrada, null caso contrário
     */
    findDistance: async function (origin, destination) {
        try {
            // Busca coordenadas de origem e destino em paralelo para ser mais rápido
            const [originCoords, destCoords] = await Promise.all([
                this.getCoordinates(origin),
                this.getCoordinates(destination)
            ]);

            // Se ambas as coordenadas foram encontradas, calcula a rota entre elas
            if (originCoords && destCoords) {
                return await this.getRouteDistance(originCoords, destCoords);
            }
        } catch (error) {
            console.error('Erro no fluxo de cálculo de distância:', error);
        }

        return null;
    }
};
