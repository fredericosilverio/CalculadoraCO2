/**
 * CONFIG - Objeto Global de Configuração
 * Contém fatores de emissão, metadados dos meios de transporte e funções utilitárias de configuração
 */

const CONFIG = {
    /**
     * Fatores de emissão de CO2 em kg por quilômetro para cada meio de transporte
     * Baseado em médias padrão de emissão
     */
    EMISSION_FACTORS: {
        bicycle: 0,       // Bicicleta: 0 emissão (transporte ativo)
        car: 0.12,        // Carro: Média de 120g/km (gasolina)
        bus: 0.089,       // Ônibus: Média de 89g/km por passageiro (eficiência coletiva)
        truck: 0.96       // Caminhão: Alta emissão por km
    },

    /**
     * Metadados dos meios de transporte para renderização na Interface (UI)
     * Contém Labels, Ícones (SVG) e Cores temáticas
     */
    TRANSPORT_MODES: {
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
    },

    /**
     * Configuração dos Créditos de Carbono
     * Define quanto CO2 equivale a 1 crédito e a faixa de preço
     */
    CARBON_CREDIT: {
        KG_PER_CREDIT: 1000,    // 1 Crédito = 1 Tonelada (1000kg) de CO2
        PRICE_MIN_BRL: 50,      // Preço mínimo em Reais
        PRICE_MAX_BRL: 150      // Preço máximo em Reais
    },

    /**
     * Configura o Autocomplete Dinâmico de Cidades
     * Utiliza a API do Nominatim via RoutesDB para sugerir cidades enquanto o usuário digita
     * Adiciona listeners aos campos de 'origem' e 'destino'
     */
    setupCityAutocomplete: function () {
        const inputs = ['origin', 'destination'];
        const datalist = document.getElementById('cities-list');
        let debounceTimer;

        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;

            input.addEventListener('input', (e) => {
                const query = e.target.value;

                // Limpa timer anterior (Debounce)
                clearTimeout(debounceTimer);

                // Aguarda 500ms após o usuário parar de digitar para chamar a API
                debounceTimer = setTimeout(async () => {
                    if (query.length < 3) return;

                    try {
                        // Busca sugestões de cidades
                        const suggestions = await RoutesDB.searchCities(query);

                        // Limpa opções atuais
                        datalist.innerHTML = '';

                        // Adiciona novas opções ao datalist
                        suggestions.forEach(place => {
                            const option = document.createElement('option');
                            option.value = place.name;
                            datalist.appendChild(option);
                        });
                    } catch (error) {
                        console.error('Erro no autocomplete de cidades:', error);
                    }
                }, 500);
            });
        });
    },

    /**
     * Configura o cálculo automático de distância
     * Quando origem e destino são preenchidos, aciona o cálculo de rota
     * Também gerencia o feedback visual e a opção de inserção manual
     */
    setupDistanceAutofill: function () {
        // Seleção de elementos do DOM
        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');
        const distanceInput = document.getElementById('distance');
        const manualCheckbox = document.getElementById('manual-distance');
        const helperText = document.querySelector('.form-group__helper-text');

        /**
         * Tenta encontrar e preencher a distância entre as cidades selecionadas
         * Função Assíncrona que consulta APIs externas
         */
        const tryFindDistance = async () => {
            // Obtém valores limpos (sem espaços extras)
            const origin = originInput.value.trim();
            const destination = destinationInput.value.trim();

            // Só busca se ambos os campos estiverem preenchidos
            if (origin && destination) {
                // Estado de Carregamento
                if (helperText) {
                    helperText.textContent = '🔄 Buscando rota e calculando distância...';
                    helperText.style.color = '#3b82f6';
                }
                distanceInput.value = '';
                distanceInput.placeholder = '...';

                try {
                    // Busca a distância da rota (assíncrono)
                    const distance = await RoutesDB.findDistance(origin, destination);

                    if (distance !== null) {
                        // Rota encontrada - preenche o valor
                        distanceInput.value = distance;
                        distanceInput.readOnly = true;

                        // Mensagem de Sucesso
                        if (helperText) {
                            helperText.textContent = `✓ Distância encontrada: ${distance} km`;
                            helperText.style.color = '#10b981';
                        }
                    } else {
                        // Rota não encontrada
                        distanceInput.value = '';
                        distanceInput.readOnly = false;
                        distanceInput.placeholder = '0';

                        // Sugere preenchimento manual
                        if (helperText) {
                            helperText.textContent = 'Rota não encontrada. Por favor, insira a distância manualmente.';
                            helperText.style.color = '#f59e0b';
                        }
                    }
                } catch (error) {
                    console.error('Erro ao buscar distância:', error);
                    distanceInput.readOnly = false;
                    distanceInput.placeholder = '0';
                    if (helperText) {
                        helperText.textContent = 'Erro ao buscar rota. Insira manualmente.';
                        helperText.style.color = '#ef4444';
                    }
                }
            }
        };

        // Adiciona listeners de mudança (change) nos inputs de cidade
        // O evento 'change' dispara quando o campo perde o foco ou uma opção é selecionada
        originInput.addEventListener('change', tryFindDistance);
        destinationInput.addEventListener('change', tryFindDistance);

        // Gerencia o checkbox de distância manual
        manualCheckbox.addEventListener('change', function () {
            if (this.checked) {
                // Ativa modo manual
                distanceInput.readOnly = false;
                distanceInput.focus();

                if (helperText) {
                    helperText.textContent = 'Digite a distância manualmente';
                    helperText.style.color = '#6b7280';
                }
            } else {
                // Ao desmarcar, tenta buscar a rota novamente
                tryFindDistance();
            }
        });
    }
};
