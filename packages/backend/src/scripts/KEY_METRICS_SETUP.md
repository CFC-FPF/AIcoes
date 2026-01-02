# Key Metrics Setup - Guia de Uso

Este guia explica como buscar e armazenar as métricas chave das ações: **Market Cap**, **P/E Ratio**, **Volume** e **52W High**.

## 📊 Métricas Disponíveis

| Métrica | Descrição | Fonte Yahoo Finance |
|---------|-----------|---------------------|
| **Market Cap** | Capitalização de mercado em USD | `price.marketCap` ou `summaryDetail.marketCap` |
| **P/E Ratio** | Price-to-Earnings ratio (TTM) | `summaryDetail.trailingPE` |
| **Volume** | Volume médio de negociação | `summaryDetail.averageVolume` |
| **52W High** | Preço máximo em 52 semanas | `summaryDetail.fiftyTwoWeekHigh` |

## 🗄️ Passo 1: Atualizar o Schema do Banco de Dados

Execute o SQL no **Supabase SQL Editor**:

```bash
# O arquivo está em:
packages/backend/src/scripts/addKeyMetrics.sql
```

Este comando adiciona 4 novas colunas à tabela `stocks`:
- `market_cap` (BIGINT)
- `pe_ratio` (DECIMAL)
- `volume` (BIGINT)
- `week_52_high` (DECIMAL)

## 🚀 Passo 2: Buscar as Métricas

### Uso básico (símbolos padrão: AAPL, MSFT, GOOGL)
```bash
cd packages/backend
npm run fetch-key-metrics
```

### Buscar para símbolos específicos
```bash
npm run fetch-key-metrics TSLA NVDA AMZN
```

### Buscar para uma única ação
```bash
npm run fetch-key-metrics AAPL
```

## 📝 Output Exemplo

```
🚀 KEY METRICS FETCH SCRIPT
============================

📋 Stocks to process: AAPL

==================================================
🔍 Processing: AAPL
==================================================
  📊 Found: Apple Inc.
  🏢 Exchange: NMS
  🆔 Stock ID: 1
  📦 Current key metrics in DB:
     Market Cap: Not set
     P/E Ratio: Not set
     Avg Volume: Not set
     52W High: Not set
  📡 Fetching key metrics from Yahoo Finance...
  📝 Updating database with key metrics...
  ✅ Successfully updated key metrics
     Market Cap: $3.45T
     P/E Ratio: 35.24
     Avg Volume: 54.32M
     52W High: $237.23
  ✅ AAPL completed successfully!

==================================================
📊 SUMMARY
==================================================
✅ Successful: 1/1
❌ Failed: 0/1

✨ Script completed!
```

## 🔧 Integração com TypeScript

O modelo `Stock` agora inclui os novos campos:

```typescript
import type { Stock } from 'shared';

const stock: Stock = {
  stock_id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NMS',
  market_cap: 3450000000000,     // 3.45T
  pe_ratio: 35.24,
  volume: 54320000,               // 54.32M
  week_52_high: 237.23,
  // ... outros campos
};
```

## ⚠️ Notas Importantes

1. **Rate Limiting**: O script espera 1 segundo entre cada requisição para respeitar a API do Yahoo Finance
2. **Dados Opcionais**: Nem todas as ações têm todos os dados disponíveis (retorna `null` se não disponível)
3. **Atualização**: Execute o script regularmente para manter as métricas atualizadas
4. **Pré-requisito**: A ação deve existir na tabela `stocks` antes de buscar as métricas

## 🔄 Automatização (Opcional)

Você pode adicionar um cron job ou agendar a execução:

```bash
# Executar todos os dias às 6h da manhã (após fechamento do mercado US)
0 6 * * * cd /path/to/AIcoes/packages/backend && npm run fetch-key-metrics
```

## 📚 Referências

- **Sources**:
  - [yahoo-finance2 - npm](https://www.npmjs.com/package/yahoo-finance2)
  - [Modules - yahooquery](https://yahooquery.dpguthrie.com/guide/ticker/modules/)
  - [Yahoo Finance API Guide](https://algotrading101.com/learn/yahoo-finance-api-guide/)
