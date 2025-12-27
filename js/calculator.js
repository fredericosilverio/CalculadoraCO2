/**
 * Calculator - Lógica de Negócio da Calculadora
 * Realiza todos os cálculos de emissão, comparações e estimativas de crédito
 */

const Calculator = {
    /**
     * Calcula a emissão de CO2 para um único modo de transporte
     * Fórmula: Distância (km) * Fator de Emissão (kg CO2/km)
     * 
     * @param {string} mode - Identificador do modo (ex: 'car', 'bus')
     * @param {number} distance - Distância em quilômetros
     * @returns {number} Emissão total em kg de CO2
     */
    calculateEmission: function (mode, distance) {
        const factor = CONFIG.EMISSION_FACTORS[mode];
        return distance * factor;
    },

    /**
     * Calcula as emissões para todos os modos de transporte disponíveis
     * Útil para gerar a tabela comparativa
     * 
     * @param {number} distance - Distância em quilômetros
     * @returns {Array<Object>} Lista de objetos contendo ID e Emissão de cada modo
     */
    calculateAllModes: function (distance) {
        const modes = Object.keys(CONFIG.TRANSPORT_MODES);
        return modes.map(mode => ({
            id: mode,
            emission: this.calculateEmission(mode, distance)
        })).sort((a, b) => a.emission - b.emission); // Ordena do menos poluente para o mais poluente
    },

    /**
     * Calcula a economia de emissão em relação ao carro (referência)
     * @param {string} selectedMode - ID do modo selecionado
     * @param {number} distance - Distância em quilômetros
     * @returns {Object} Objeto com kg economizados e porcentagem de redução
     */
    calculateSavings: function (selectedMode, distance) {
        const carEmission = this.calculateEmission('car', distance);
        const selectedEmission = this.calculateEmission(selectedMode, distance);

        const savedKg = carEmission - selectedEmission;
        const percentage = carEmission > 0 ? (savedKg / carEmission) * 100 : 0;

        return {
            savedKg: Math.max(0, savedKg), // Nunca retorna valor negativo
            percentage: Math.max(0, percentage).toFixed(1)
        };
    },

    /**
     * Calcula a quantidade de créditos de carbono necessários para compensar a emissão
     * @param {number} emissionKg - Total de CO2 emitido em kg
     * @returns {number} Créditos necessários (1 crédito = 1 tonelada de CO2)
     */
    calculateCarbonCredits: function (emissionKg) {
        return emissionKg / CONFIG.CARBON_CREDIT.KG_PER_CREDIT;
    },

    /**
     * Estima o preço dos créditos de carbono
     * @param {number} credits - Quantidade de créditos
     * @returns {Object} Faixa de preço {min, max, average} em Reais
     */
    estimateCreditPrice: function (credits) {
        const minPrice = credits * CONFIG.CARBON_CREDIT.PRICE_MIN_BRL;
        const maxPrice = credits * CONFIG.CARBON_CREDIT.PRICE_MAX_BRL;

        return {
            min: minPrice,
            max: maxPrice,
            average: (minPrice + maxPrice) / 2
        };
    }
};
