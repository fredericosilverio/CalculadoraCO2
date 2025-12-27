# 🌿 Calculadora de Emissão de CO₂

Uma aplicação web moderna e interativa para calcular a pegada de carbono de viagens entre cidades brasileiras. O projeto visa conscientizar sobre o impacto ambiental de diferentes meios de transporte e sugerir compensações através de créditos de carbono.

![Preview do Projeto](https://placehold.co/800x400/e0f2f1/10b981?text=Calculadora+CO2)

## ✨ Funcionalidades

*   **Busca Inteligente de Cidades**: Integração com a API **Nominatim (OpenStreetMap)** para sugerir cidades brasileiras enquanto você digita.
*   **Cálculo Automático de Distância**: Determina a distância de condução real entre duas cidades usando a API **OSRM**, eliminando a necessidade de tabelas fixas.
*   **Cálculo de Emissões**: Estima a quantidade de CO₂ emitida baseada no meio de transporte (Carro, Ônibus, Caminhão ou Bicicleta).
*   **Comparativo Visual**: Exibe gráficos comparando o meio de transporte escolhido com outras alternativas, destacando a opção mais ecológica.
*   **Economia de Carbono**: Mostra quanto você deixou de emitir ao escolher uma opção sustentável em vez de um carro.
*   **Créditos de Carbono**: Calcula quantos créditos seriam necessários para compensar sua viagem e estima o custo em Reais (BRL).
*   **Interface Premium**: Design responsivo com efeitos de *Glassmorphism*, animações suaves e ícones SVG modernos.

## 🚀 Tecnologias Utilizadas

*   **HTML5 & CSS3**: Estrutura semântica e estilização avançada com variáveis CSS e Flexbox/Grid.
*   **JavaScript (ES6+)**: Lógica de negócios modular, manipulação do DOM e chamadas assíncronas (Async/Await).
*   **APIs Externas**:
    *   [OpenStreetMap / Nominatim](https://nominatim.org/): Geocodificação de cidades.
    *   [OSRM (Open Source Routing Machine)](https://project-osrm.org/): Cálculo de rotas e distâncias de direção.
*   **Google Fonts**: Tipografia moderna com a fonte 'Outfit'.

## 📂 Estrutura do Projeto

O código é organizado de forma modular para fácil manutenção:

*   `index.html`: Estrutura principal da página.
*   `css/style.css`: Folha de estilos completa (temas, layout, animações).
*   `js/`:
    *   `app.js`: Controlador principal (Entry point). Gerencia eventos de formulário e carregamento.
    *   `config.js`: Configurações globais (fatores de emissão, metadados de transporte) e setup de eventos de input.
    *   `routes-data.js`: Camada de serviço que se comunica com as APIs de mapa. Gerencia cache de cidades e cálculo de distância.
    *   `calculator.js`: Lógica pura de negócio (cálculos matemáticos de emissão, economia e créditos).
    *   `ui.js`: Camada de visualização. Responsável por formatar números/moedas e gerar o HTML dos resultados.

## 🛠️ Como Usar

1.  **Clone o repositório** ou baixe os arquivos.
2.  **Abra o `index.html`** em seu navegador preferido.
3.  **Digite a Origem e Destino**: O sistema irá sugerir cidades. Selecione as opções desejadas.
4.  **Aguarde**: A distância será calculada automaticamente.
5.  **Escolha o Transporte**: Selecione entre Carro, Ônibus, Caminhão ou Bicicleta.
6.  **Calcular**: Clique no botão para ver o relatório completo de impacto ambiental.

## 🌍 Fatores de Emissão Considerados

Os cálculos utilizam fatores médios de emissão (kg CO₂/km):
*   🚲 **Bicicleta**: 0.0 (Zero emissão)
*   🚌 **Ônibus**: 0.089 (Alta eficiência por passageiro)
*   🚗 **Carro**: 0.12 (Média para carros a gasolina)
*   🚚 **Caminhão**: 0.96 (Transporte pesado de carga)

## 📄 Licença

Este projeto é de código aberto e livre para uso educacional e pessoal.

---
Desenvolvido com 💚 para um futuro mais sustentável.
