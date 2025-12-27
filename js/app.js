/**
 * App.js - Controlador Principal da Aplicação
 * Inicializa a aplicação, gerencia eventos globais e orquestra o fluxo de dados
 */
document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const form = document.getElementById('emission-form');
    const loading = document.getElementById('loading');

    /**
     * Inicializa a calculadora ao carregar a página
     */

    // Configura o autocomplete dinâmico de cidades
    CONFIG.setupCityAutocomplete();

    // Configura o cálculo automático de distância
    CONFIG.setupDistanceAutofill();

    /**
     * Gerencia o envio do formulário
     * Impede o reload da página e processa os dados
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Coleta dados do formulário
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        const distance = parseFloat(document.getElementById('distance').value);
        const mode = document.getElementById('transport-mode').value;

        // Validação básica
        if (!distance || distance <= 0) {
            alert('Por favor, insira uma distância válida ou aguarde o cálculo automático.');
            return;
        }

        // Mostra estado de carregamento e rola até ele
        UI.showElement(loading);
        UI.scrollToElement(loading);

        // Esconde resultados anteriores para limpar a visão
        UI.hideElement(document.getElementById('results'));
        UI.hideElement(document.getElementById('comparison'));
        UI.hideElement(document.getElementById('carbon-credits'));

        // Simula um pequeno tempo de processamento para UX (sensação de "calculando")
        await new Promise(resolve => setTimeout(resolve, 800));

        // --- Etapa 1: Cálculo Principal ---
        const emission = Calculator.calculateEmission(mode, distance);
        const savings = Calculator.calculateSavings(mode, distance);

        // Renderiza os resultados principais
        UI.renderResults({
            origin,
            destination,
            distance,
            emission,
            mode,
            savings
        });

        // --- Etapa 2: Comparativo ---
        const allModesData = Calculator.calculateAllModes(distance);
        UI.renderComparison(allModesData, mode);

        // --- Etapa 3: Créditos de Carbono ---
        const credits = Calculator.calculateCarbonCredits(emission);
        const priceEstimate = Calculator.estimateCreditPrice(credits);

        UI.renderCarbonCredits({
            credits,
            price: priceEstimate
        });

        // Finaliza o carregamento e remove o spinner
        UI.hideElement(loading);
        UI.scrollToElement(document.getElementById('results'));
    });
});
