/**
 * App.js - Controlador Principal da Aplicação
 * Inicializa a aplicação, gerencia eventos globais e orquestra o fluxo de dados
 */

// ============================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================
const APP_CONFIG = {
    LOADING_DELAY_MS: 400,  // Delay mínimo para UX de loading
    SELECTORS: {
        form: 'calculator-form',
        loading: 'loading',
        results: 'results',
        comparison: 'comparison',
        carbonCredits: 'carbon-credits',
        origin: 'origin',
        destination: 'destination',
        distance: 'distance',
        transportRadio: 'input[name="transport"]:checked'
    },
    MESSAGES: {
        invalidDistance: 'Por favor, insira uma distância válida ou aguarde o cálculo automático.'
    }
};

// ============================================
// CACHE DE ELEMENTOS DOM
// ============================================
const DOM = {};

/**
 * Inicializa o cache de elementos DOM para evitar múltiplas buscas
 */
function initDOMCache() {
    const s = APP_CONFIG.SELECTORS;
    DOM.form = document.getElementById(s.form);
    DOM.loading = document.getElementById(s.loading);
    DOM.results = document.getElementById(s.results);
    DOM.comparison = document.getElementById(s.comparison);
    DOM.carbonCredits = document.getElementById(s.carbonCredits);
    DOM.origin = document.getElementById(s.origin);
    DOM.destination = document.getElementById(s.destination);
    DOM.distance = document.getElementById(s.distance);
}

/**
 * Valida os dados do formulário antes do cálculo
 * @param {number} distance - Distância informada
 * @returns {boolean} True se válido
 */
function validateFormData(distance) {
    if (!distance || distance <= 0 || isNaN(distance)) {
        showValidationError(APP_CONFIG.MESSAGES.invalidDistance);
        return false;
    }
    return true;
}

/**
 * Exibe mensagem de erro de validação usando UI apropriada
 * @param {string} message - Mensagem a exibir
 */
function showValidationError(message) {
    // Usa UI customizada ao invés de alert() nativo para melhor UX
    const helperText = document.querySelector('.form-group__helper-text');
    if (helperText) {
        helperText.textContent = `⚠️ ${message}`;
        helperText.style.color = '#ef4444';
        setTimeout(() => {
            helperText.textContent = 'A distância será preenchida automaticamente';
            helperText.style.color = '';
        }, 4000);
    }
    DOM.distance.focus();
}

/**
 * Coleta os dados do formulário de forma segura
 * @returns {Object} Dados do formulário
 */
function collectFormData() {
    const transportRadio = document.querySelector(APP_CONFIG.SELECTORS.transportRadio);
    return {
        origin: DOM.origin.value.trim(),
        destination: DOM.destination.value.trim(),
        distance: parseFloat(DOM.distance.value) || 0,
        mode: transportRadio ? transportRadio.value : 'car'
    };
}

/**
 * Gerencia o estado de loading da aplicação
 * @param {boolean} isLoading - Estado de carregamento
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        UI.showElement(DOM.loading);
        UI.scrollToElement(DOM.loading);
        UI.hideElement(DOM.results);
        UI.hideElement(DOM.comparison);
        UI.hideElement(DOM.carbonCredits);
    } else {
        UI.hideElement(DOM.loading);
    }
}

/**
 * Processa os cálculos e renderiza os resultados
 * @param {Object} formData - Dados coletados do formulário
 */
function processCalculations(formData) {
    const { origin, destination, distance, mode } = formData;

    // Etapa 1: Cálculo Principal
    const emission = Calculator.calculateEmission(mode, distance);
    const savings = Calculator.calculateSavings(mode, distance);

    UI.renderResults({
        origin,
        destination,
        distance,
        emission,
        mode,
        savings
    });

    // Etapa 2: Comparativo
    const allModesData = Calculator.calculateAllModes(distance);
    UI.renderComparison(allModesData, mode);

    // Etapa 3: Créditos de Carbono
    const credits = Calculator.calculateCarbonCredits(emission);
    const priceEstimate = Calculator.estimateCreditPrice(credits);

    UI.renderCarbonCredits({
        credits,
        price: priceEstimate
    });

    // Scroll para resultados
    UI.scrollToElement(DOM.results);
}

/**
 * Handler principal do submit do formulário
 * @param {Event} e - Evento de submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = collectFormData();

    // Validação
    if (!validateFormData(formData.distance)) {
        return;
    }

    // Loading state
    setLoadingState(true);

    // Delay mínimo para UX (sensação de processamento)
    await new Promise(resolve => setTimeout(resolve, APP_CONFIG.LOADING_DELAY_MS));

    // Processar e renderizar
    processCalculations(formData);

    // Finalizar loading
    setLoadingState(false);
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa cache de elementos
    initDOMCache();

    // Configura autocomplete e autofill de distância
    CONFIG.setupCityAutocomplete();
    CONFIG.setupDistanceAutofill();

    // Registra handler de submit
    if (DOM.form) {
        DOM.form.addEventListener('submit', handleFormSubmit);
    }
});
