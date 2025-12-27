/**
 * Calculator - Lógica de Negócio da Calculadora
 * Realiza todos os cálculos de emissão, comparações e estimativas de crédito
 * 
 * Este módulo contém apenas lógica pura (sem side effects),
 * facilitando testes unitários e manutenção.
 */

const Calculator = {
    /**
     * Valida se o modo de transporte existe na configuração
     * @param {string} mode - Identificador do modo
     * @returns {boolean} True se válido
     */
    isValidMode: function (mode) {
        return mode in CONFIG.EMISSION_FACTORS;
    },

    /**
     * Obtém o fator de emissão para um modo, com fallback seguro
     * @param {string} mode - Identificador do modo
     * @returns {number} Fator de emissão (0 se inválido)
     */
    getEmissionFactor: function (mode) {
        return CONFIG.EMISSION_FACTORS[mode] ?? 0;
    },

    /**
     * Calcula a emissão de CO2 para um único modo de transporte
     * Fórmula: Distância (km) * Fator de Emissão (kg CO2/km)
     * 
     * @param {string} mode - Identificador do modo (ex: 'car', 'bus')
     * @param {number} distance - Distância em quilômetros
     * @returns {number} Emissão total em kg de CO2
     */
    calculateEmission: function (mode, distance) {
        // Validação de entrada
        if (typeof distance !== 'number' || distance < 0 || isNaN(distance)) {
            return 0;
        }

        const factor = this.getEmissionFactor(mode);
        return distance * factor;
    },

    /**
     * Calcula as emissões para todos os modos de transporte disponíveis
     * Útil para gerar a tabela comparativa
     * 
     * @param {number} distance - Distância em quilômetros
     * @returns {Array<Object>} Lista ordenada de objetos contendo ID e Emissão de cada modo
     */
    calculateAllModes: function (distance) {
        const modes = Object.keys(CONFIG.TRANSPORT_MODES);

        return modes
            .map(mode => ({
                id: mode,
                emission: this.calculateEmission(mode, distance)
            }))
            .sort((a, b) => a.emission - b.emission); // Ordena do menos para mais poluente
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

        const savedKg = Math.max(0, carEmission - selectedEmission);
        const percentage = carEmission > 0
            ? ((savedKg / carEmission) * 100).toFixed(1)
            : '0.0';

        return {
            savedKg,
            percentage
        };
    },

    /**
     * Calcula a quantidade de créditos de carbono necessários para compensar a emissão
     * @param {number} emissionKg - Total de CO2 emitido em kg
     * @returns {number} Créditos necessários (1 crédito = 1 tonelada de CO2)
     */
    calculateCarbonCredits: function (emissionKg) {
        if (typeof emissionKg !== 'number' || emissionKg < 0 || isNaN(emissionKg)) {
            return 0;
        }
        return emissionKg / CONFIG.CARBON_CREDIT.KG_PER_CREDIT;
    },

    /**
     * Estima o preço dos créditos de carbono
     * @param {number} credits - Quantidade de créditos
     * @returns {Object} Faixa de preço {min, max, average} em Reais
     */
    estimateCreditPrice: function (credits) {
        if (typeof credits !== 'number' || credits < 0 || isNaN(credits)) {
            return { min: 0, max: 0, average: 0 };
        }

        const { PRICE_MIN_BRL, PRICE_MAX_BRL } = CONFIG.CARBON_CREDIT;
        const minPrice = credits * PRICE_MIN_BRL;
        const maxPrice = credits * PRICE_MAX_BRL;

        return {
            min: minPrice,
            max: maxPrice,
            average: (minPrice + maxPrice) / 2
        };
    },

    /**
     * Calcula o equivalente em árvores para compensação
     * (Uma árvore absorve aproximadamente 22kg de CO2 por ano)
     * @param {number} emissionKg - Total de CO2 emitido em kg
     * @returns {number} Número de árvores necessárias
     */
    calculateTreeEquivalent: function (emissionKg) {
        const KG_PER_TREE_PER_YEAR = 22;
        if (typeof emissionKg !== 'number' || emissionKg < 0) {
            return 0;
        }
        return Math.ceil(emissionKg / KG_PER_TREE_PER_YEAR);
    }
};
