/**
 * UI - Manipulador da Interface do Usuário
 * Responsável por renderizar resultados, formatar valores e gerenciar interações visuais
 */
const UI = {
    // ============================================
    // CACHE DE ELEMENTOS (preenchido sob demanda)
    // ============================================
    _elementsCache: new Map(),

    /**
     * Obtém elemento do cache ou busca e armazena
     * @param {string} id - ID do elemento
     * @returns {HTMLElement|null} Elemento encontrado
     */
    getElement: function (id) {
        if (!this._elementsCache.has(id)) {
            this._elementsCache.set(id, document.getElementById(id));
        }
        return this._elementsCache.get(id);
    },

    /**
     * Formata um número para o padrão brasileiro (pt-BR)
     * Ex: 1000.5 -> "1.000,5"
     * 
     * @param {number} value - O número a ser formatado
     * @param {number} [decimals=2] - Número de casas decimais
     * @returns {string} String formatada
     */
    formatNumber: function (value, decimals = 2) {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0';
        }
        return value.toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * Formata um valor monetário para o padrão Real Brasileiro (BRL)
     * Ex: 50.0 -> "R$ 50,00"
     * 
     * @param {number} value - Valor a ser formatado
     * @returns {string} String formatada como moeda
     */
    formatCurrency: function (value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return 'R$ 0,00';
        }
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    /**
     * Utilitário para mostrar um elemento DOM (remove classe 'hidden')
     * @param {HTMLElement} element - O elemento a ser exibido
     */
    showElement: function (element) {
        if (element) {
            element.classList.remove('hidden');
        }
    },

    /**
     * Utilitário para ocultar um elemento DOM (adiciona classe 'hidden')
     * @param {HTMLElement} element - O elemento a ser ocultado
     */
    hideElement: function (element) {
        if (element) {
            element.classList.add('hidden');
        }
    },

    /**
     * Rola a página suavemente até um elemento
     * @param {HTMLElement} element - O elemento alvo
     */
    scrollToElement: function (element) {
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} str - String a escapar
     * @returns {string} String segura
     */
    escapeHTML: function (str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Renderiza a seção principal de resultados da emissão
     * Gera os cartões de informação com ícones e valores calculados
     * 
     * @param {Object} data - Objeto contendo os dados do cálculo
     */
    renderResults: function (data) {
        const resultsContainer = this.getElement('results-content');
        if (!resultsContainer) return;

        const modeData = CONFIG.TRANSPORT_MODES[data.mode];
        const safeOrigin = this.escapeHTML(data.origin);
        const safeDestination = this.escapeHTML(data.destination);

        let html = `
            <h2 class="section-title">Resultados da Emissão</h2>
            
            <div class="results__grid">
                <!-- Cartão da Rota -->
                <div class="results__card">
                    <div class="results__card-icon">🗺️</div>
                    <div class="results__card-content">
                        <h3 class="results__card-title">Rota</h3>
                        <p class="results__card-value">${safeOrigin} → ${safeDestination}</p>
                    </div>
                </div>
                
                <!-- Cartão da Distância -->
                <div class="results__card">
                    <div class="results__card-icon">📏</div>
                    <div class="results__card-content">
                        <h3 class="results__card-title">Distância</h3>
                        <p class="results__card-value">${this.formatNumber(data.distance, 0)} km</p>
                    </div>
                </div>
                
                <!-- Cartão da Emissão (Destaque) -->
                <div class="results__card results__card--highlight">
                    <div class="results__card-icon">🌿</div>
                    <div class="results__card-content">
                        <h3 class="results__card-title">Emissão de CO₂</h3>
                        <p class="results__card-value results__card-value--large">${this.formatNumber(data.emission)} kg</p>
                    </div>
                </div>
                
                <!-- Cartão do Meio de Transporte -->
                <div class="results__card">
                    <div class="results__card-icon">${modeData.icon}</div>
                    <div class="results__card-content">
                        <h3 class="results__card-title">Meio de Transporte</h3>
                        <p class="results__card-value">${modeData.label}</p>
                    </div>
                </div>
        `;

        // Adiciona cartão de economia se aplicável
        if (data.mode !== 'car' && data.savings && data.savings.savedKg > 0) {
            html += `
                <!-- Cartão de Economia -->
                <div class="results__card results__card--success">
                    <div class="results__card-icon">✅</div>
                    <div class="results__card-content">
                        <h3 class="results__card-title">Economia vs Carro</h3>
                        <p class="results__card-value">${this.formatNumber(data.savings.savedKg)} kg</p>
                        <p class="results__card-subtitle">${this.formatNumber(parseFloat(data.savings.percentage))}% menos emissões</p>
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        resultsContainer.innerHTML = html;
        this.showElement(this.getElement('results'));
    },

    /**
     * Renderiza a seção de comparação entre meios de transporte
     * Mostra barras visuais comparando a emissão do meio escolhido com os outros
     * 
     * @param {Array<Object>} modesArray - Lista de objetos com dados de cada modo
     * @param {string} selectedMode - ID do modo selecionado pelo usuário
     */
    renderComparison: function (modesArray, selectedMode) {
        const comparisonContainer = this.getElement('comparison-content');
        if (!comparisonContainer) return;

        // Encontra a maior emissão para calcular as porcentagens das barras
        const maxEmission = Math.max(...modesArray.map(m => m.emission));

        let html = `
            <div class="comparison__header">
                <h2 class="section-title">Comparativo de Emissões</h2>
                <p class="section-subtitle">Veja como sua escolha se compara com outras opções</p>
            </div>
            
            <div class="comparison__chart">
        `;

        modesArray.forEach(mode => {
            const config = CONFIG.TRANSPORT_MODES[mode.id];
            const isSelected = mode.id === selectedMode;
            // Calcula a largura da barra em porcentagem
            const widthPercentage = maxEmission > 0 ? (mode.emission / maxEmission) * 100 : 0;

            html += `
                <div class="comparison__row ${isSelected ? 'comparison__row--selected' : ''}">
                    <!-- Rótulo e Ícone -->
                    <div class="comparison__label">
                        <span class="comparison__icon">${config.icon}</span>
                        <span class="comparison__name">${config.label} ${isSelected ? '(Sua escolha)' : ''}</span>
                    </div>
                    
                    <!-- Barra de Progresso e Valor -->
                    <div class="comparison__bar-container">
                        <div class="comparison__bar" style="width: ${widthPercentage}%; background-color: ${config.color}"></div>
                    </div>
                    <span class="comparison__value">${this.formatNumber(mode.emission)} kg</span>
                </div>
            `;
        });

        html += `
            </div>
            
            <!-- Dica Ecológica -->
            <div class="comparison__tip">
                <span class="comparison__tip-icon">💡</span>
                <p class="comparison__tip-text">
                    <strong>Dica:</strong> Escolher meios de transporte mais sustentáveis ajuda a reduzir 
                    significativamente as emissões de CO₂ e contribui para um planeta mais saudável!
                </p>
            </div>
        `;

        comparisonContainer.innerHTML = html;
        this.showElement(this.getElement('comparison'));
    },

    /**
     * Renderiza a seção de Créditos de Carbono
     * Calcula e exibe quantos créditos seriam necessários para compensar a emissão
     * 
     * @param {Object} creditsData - Dados calculados sobre créditos
     */
    renderCarbonCredits: function (creditsData) {
        const creditsContainer = this.getElement('carbon-credits-content');
        const carbonCreditsSection = this.getElement('carbon-credits');

        if (!creditsContainer) return;

        // Se a emissão for muito baixa, não sugerimos compra de crédito
        if (creditsData.credits < 0.001) {
            this.hideElement(carbonCreditsSection);
            return;
        }

        const html = `
            <h2 class="section-title">Créditos de Carbono</h2>
            
            <div class="carbon-credits__grid">
                <!-- Cartão de Créditos Necessários -->
                <div class="carbon-credits__card">
                    <div class="carbon-credits__card-header">
                        <span class="carbon-credits__icon">🌳</span>
                        <h3 class="carbon-credits__card-title">Créditos Necessários</h3>
                    </div>
                    <div class="carbon-credits__card-body">
                        <p class="carbon-credits__value">${this.formatNumber(creditsData.credits, 4)}</p>
                        <p class="carbon-credits__helper">1 crédito = 1.000 kg CO₂</p>
                    </div>
                </div>
                
                <!-- Cartão de Estimativa de Custo -->
                <div class="carbon-credits__card">
                    <div class="carbon-credits__card-header">
                        <span class="carbon-credits__icon">💰</span>
                        <h3 class="carbon-credits__card-title">Custo Estimado</h3>
                    </div>
                    <div class="carbon-credits__card-body">
                        <p class="carbon-credits__value">${this.formatCurrency(creditsData.price.average)}</p>
                        <p class="carbon-credits__helper">
                            Variação: ${this.formatCurrency(creditsData.price.min)} - ${this.formatCurrency(creditsData.price.max)}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="carbon-credits__footer">
                <p>
                    A compensação de carbono é uma forma de neutralizar suas emissões investindo em projetos 
                    ambientais como reflorestamento, energia renovável ou captura de metano.
                </p>
                <a href="https://www.google.com/search?q=comprar+creditos+de+carbono+brasil" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
                    Saiba onde compensar ↗
                </a>
            </div>
        `;

        creditsContainer.innerHTML = html;
        this.showElement(carbonCreditsSection);
    },

    /**
     * Limpa o cache de elementos (útil para testes)
     */
    clearCache: function () {
        this._elementsCache.clear();
    }
};
