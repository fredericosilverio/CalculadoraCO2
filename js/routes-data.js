/**
 * RoutesDB - Banco de Dados de Rotas e Integração com APIs de Mapa
 * Objeto global responsável por buscar cidades e calcular distâncias reais
 */
const RoutesDB = {
    // ============================================
    // CONFIGURAÇÃO DE API
    // ============================================
    API: Object.freeze({
        NOMINATIM_BASE: 'https://nominatim.openstreetmap.org/search',
        OSRM_BASE: 'https://router.project-osrm.org/route/v1/driving',
        COUNTRY_CODE: 'br',
        RESULT_LIMIT: 5
    }),

    /**
     * Cache para armazenar coordenadas e locais pesquisados
     * Evita chamadas repetidas à API para a mesma cidade
     */
    placesCache: new Map(),

    /**
     * Cache para armazenar distâncias já calculadas
     * Chave: "origem|destino" normalizado
     */
    distanceCache: new Map(),

    /**
     * Normaliza string para uso como chave de cache
     * @param {string} str - String a normalizar
     * @returns {string} String normalizada
     */
    normalizeKey: function (str) {
        return str.toLowerCase().trim();
    },

    /**
     * Gera chave única para par origem-destino
     * @param {string} origin - Cidade de origem
     * @param {string} destination - Cidade de destino
     * @returns {string} Chave do cache
     */
    getDistanceCacheKey: function (origin, destination) {
        const normalizedOrigin = this.normalizeKey(origin);
        const normalizedDest = this.normalizeKey(destination);
        // Ordena para que A->B e B->A usem mesma chave (distância é simétrica)
        return [normalizedOrigin, normalizedDest].sort().join('|');
    },

    /**
     * Faz requisição HTTP com tratamento de erro padronizado
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções do fetch
     * @returns {Promise<any>} Dados da resposta
     */
    fetchJSON: async function (url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept-Language': 'pt-BR',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Busca cidades utilizando a API do Nominatim (OpenStreetMap)
     * Limitado a resultados no Brasil.
     * 
     * @param {string} query - Texto digitado pelo usuário
     * @returns {Promise<Array>} Array de objetos de cidade { name, lat, lon }
     */
    searchCities: async function (query) {
        if (!query || query.length < 3) return [];

        try {
            const params = new URLSearchParams({
                format: 'json',
                q: query,
                countrycodes: this.API.COUNTRY_CODE,
                addressdetails: '1',
                limit: String(this.API.RESULT_LIMIT),
                featuretype: 'settlement'
            });

            const url = `${this.API.NOMINATIM_BASE}?${params}`;
            const data = await this.fetchJSON(url);

            return data.map(item => {
                const city = item.address.city ||
                    item.address.town ||
                    item.address.village ||
                    item.address.municipality ||
                    item.name;
                const state = item.address.state || '';
                const displayName = state ? `${city} - ${state}` : city;

                // Salva no cache usando Map
                this.placesCache.set(this.normalizeKey(displayName), {
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    name: displayName
                });

                return {
                    name: displayName,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon)
                };
            });
        } catch (error) {
            console.error('Erro ao buscar cidades:', error);
            return [];
        }
    },

    /**
     * Obtém as coordenadas de uma cidade (do cache ou via nova busca)
     * 
     * @param {string} cityName - Nome da cidade formatado
     * @returns {Promise<Object|null>} Objeto de coordenadas {lat, lon} ou null
     */
    getCoordinates: async function (cityName) {
        const normalizedName = this.normalizeKey(cityName);

        // Verifica cache
        if (this.placesCache.has(normalizedName)) {
            return this.placesCache.get(normalizedName);
        }

        // Fallback: busca na API
        try {
            const results = await this.searchCities(cityName);
            if (results && results.length > 0) {
                const bestMatch = results[0];
                const coordData = {
                    lat: bestMatch.lat,
                    lon: bestMatch.lon,
                    name: bestMatch.name
                };
                this.placesCache.set(normalizedName, coordData);
                return coordData;
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
            const coords = `${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}`;
            const url = `${this.API.OSRM_BASE}/${coords}?overview=false`;

            const data = await this.fetchJSON(url);

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // Converte metros para km com 1 casa decimal
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
     * Implementa cache de distâncias para evitar recálculos
     * 
     * @param {string} origin - Nome da cidade de origem
     * @param {string} destination - Nome da cidade de destino
     * @returns {Promise<number|null>} Distância em km se encontrada, null caso contrário
     */
    findDistance: async function (origin, destination) {
        // Verifica cache de distância
        const cacheKey = this.getDistanceCacheKey(origin, destination);
        if (this.distanceCache.has(cacheKey)) {
            return this.distanceCache.get(cacheKey);
        }

        try {
            // Busca coordenadas em paralelo
            const [originCoords, destCoords] = await Promise.all([
                this.getCoordinates(origin),
                this.getCoordinates(destination)
            ]);

            if (originCoords && destCoords) {
                const distance = await this.getRouteDistance(originCoords, destCoords);

                // Armazena no cache se encontrou
                if (distance !== null) {
                    this.distanceCache.set(cacheKey, distance);
                }

                return distance;
            }
        } catch (error) {
            console.error('Erro no fluxo de cálculo de distância:', error);
        }

        return null;
    },

    /**
     * Limpa os caches (útil para testes ou reset)
     */
    clearCache: function () {
        this.placesCache.clear();
        this.distanceCache.clear();
    }
};
