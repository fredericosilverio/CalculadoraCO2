/**
 * CONFIG - Objeto Global de Configuração
 * Contém fatores de emissão, metadados dos meios de transporte e funções utilitárias de configuração
 */

const CONFIG = {
    // ============================================
    // CONSTANTES DE TEMPO E LIMITES
    // ============================================
    DEBOUNCE_DELAY_MS: 400,
    MIN_QUERY_LENGTH: 3,

    /**
     * Fatores de emissão de CO2 em kg por quilômetro para cada meio de transporte
     * Baseado em médias padrão de emissão
     */
    EMISSION_FACTORS: Object.freeze({
        bicycle: 0,       // Bicicleta: 0 emissão (transporte ativo)
        car: 0.12,        // Carro: Média de 120g/km (gasolina)
        bus: 0.089,       // Ônibus: Média de 89g/km por passageiro (eficiência coletiva)
        truck: 0.96       // Caminhão: Alta emissão por km
    }),

    /**
     * Metadados dos meios de transporte para renderização na Interface (UI)
     * Contém Labels, Ícones (SVG) e Cores temáticas
     */
    TRANSPORT_MODES: Object.freeze({
        bicycle: {
            label: "Bicicleta",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 17a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`,
            color: "#10b981"
        },
        car: {
            label: "Carro",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
            color: "#3b82f6"
        },
        bus: {
            label: "Ônibus",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`,
            color: "#f59e0b"
        },
        truck: {
            label: "Caminhão",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
            color: "#ef4444"
        }
    }),

    /**
     * Configuração dos Créditos de Carbono
     * Define quanto CO2 equivale a 1 crédito e a faixa de preço
     */
    CARBON_CREDIT: Object.freeze({
        KG_PER_CREDIT: 1000,    // 1 Crédito = 1 Tonelada (1000kg) de CO2
        PRICE_MIN_BRL: 50,      // Preço mínimo em Reais
        PRICE_MAX_BRL: 150      // Preço máximo em Reais
    }),

    // ============================================
    // MENSAGENS DE FEEDBACK
    // ============================================
    MESSAGES: Object.freeze({
        searching: '🔄 Buscando rota e calculando distância...',
        found: (distance) => `✓ Distância encontrada: ${distance} km`,
        notFound: 'Rota não encontrada. Por favor, insira a distância manualmente.',
        error: 'Erro ao buscar rota. Insira manualmente.',
        manual: 'Digite a distância manualmente'
    }),

    // ============================================
    // CORES DO SISTEMA
    // ============================================
    COLORS: Object.freeze({
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        neutral: '#6b7280'
    }),

    /**
     * Utilitário de debounce para evitar chamadas excessivas
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função com debounce
     */
    debounce: function (func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Configura o Autocomplete Dinâmico de Cidades
     * Utiliza a API do Nominatim via RoutesDB para sugerir cidades enquanto o usuário digita
     * Adiciona listeners aos campos de 'origem' e 'destino'
     */
    setupCityAutocomplete: function () {
        const inputs = ['origin', 'destination'];
        const datalist = document.getElementById('cities-list');

        if (!datalist) return;

        // Handler com debounce para cada input
        const handleInput = this.debounce(async (query) => {
            if (query.length < this.MIN_QUERY_LENGTH) return;

            try {
                const suggestions = await RoutesDB.searchCities(query);

                // Limpa opções atuais usando método mais eficiente
                datalist.textContent = '';

                // Adiciona novas opções ao datalist
                const fragment = document.createDocumentFragment();
                suggestions.forEach(place => {
                    const option = document.createElement('option');
                    option.value = place.name;
                    fragment.appendChild(option);
                });
                datalist.appendChild(fragment);
            } catch (error) {
                console.error('Erro no autocomplete de cidades:', error);
            }
        }, this.DEBOUNCE_DELAY_MS);

        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;

            input.addEventListener('input', (e) => {
                handleInput(e.target.value);
            });
        });
    },

    /**
     * Atualiza o texto de ajuda com feedback visual
     * @param {HTMLElement} helperText - Elemento de texto
     * @param {string} message - Mensagem a exibir
     * @param {string} color - Cor do texto
     */
    updateHelperText: function (helperText, message, color) {
        if (helperText) {
            helperText.textContent = message;
            helperText.style.color = color;
        }
    },

    /**
     * Configura o cálculo automático de distância
     * Quando origem e destino são preenchidos, aciona o cálculo de rota
     * Também gerencia o feedback visual e a opção de inserção manual
     */
    setupDistanceAutofill: function () {
        // Seleção de elementos do DOM (cache local)
        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');
        const distanceInput = document.getElementById('distance');
        const manualCheckbox = document.getElementById('manual-distance');
        const helperText = document.querySelector('.form-group__helper-text');

        if (!originInput || !destinationInput || !distanceInput) return;

        const self = this; // Referência para uso em closures

        /**
         * Tenta encontrar e preencher a distância entre as cidades selecionadas
         * Função Assíncrona que consulta APIs externas
         */
        const tryFindDistance = async () => {
            const origin = originInput.value.trim();
            const destination = destinationInput.value.trim();

            // Só busca se ambos os campos estiverem preenchidos
            if (!origin || !destination) return;

            // Estado de Carregamento
            self.updateHelperText(helperText, self.MESSAGES.searching, self.COLORS.info);
            distanceInput.value = '';
            distanceInput.placeholder = '...';

            try {
                const distance = await RoutesDB.findDistance(origin, destination);

                if (distance !== null) {
                    // Rota encontrada
                    distanceInput.value = distance;
                    distanceInput.readOnly = true;
                    self.updateHelperText(helperText, self.MESSAGES.found(distance), self.COLORS.success);
                } else {
                    // Rota não encontrada
                    distanceInput.value = '';
                    distanceInput.readOnly = false;
                    distanceInput.placeholder = '0';
                    self.updateHelperText(helperText, self.MESSAGES.notFound, self.COLORS.warning);
                }
            } catch (error) {
                console.error('Erro ao buscar distância:', error);
                distanceInput.readOnly = false;
                distanceInput.placeholder = '0';
                self.updateHelperText(helperText, self.MESSAGES.error, self.COLORS.error);
            }
        };

        // Adiciona listeners de mudança (change) nos inputs de cidade
        originInput.addEventListener('change', tryFindDistance);
        destinationInput.addEventListener('change', tryFindDistance);

        // Gerencia o checkbox de distância manual
        if (manualCheckbox) {
            manualCheckbox.addEventListener('change', function () {
                if (this.checked) {
                    distanceInput.readOnly = false;
                    distanceInput.focus();
                    self.updateHelperText(helperText, self.MESSAGES.manual, self.COLORS.neutral);
                } else {
                    tryFindDistance();
                }
            });
        }
    }
};
