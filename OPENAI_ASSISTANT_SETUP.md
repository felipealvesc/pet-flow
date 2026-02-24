# Integração com Assistente OpenAI

## Visão Geral

O sistema PetFlow CRM agora integra um assistente OpenAI especializado em extração de informações de produtos para pet shops. Com apenas o nome do produto, o assistente gera automaticamente todas as informações necessárias.

## Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# OpenAI API
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY=sk-proj-... # Sua chave OpenAI
OPENAI_ASSISTANT_ID=asst_buC0p8eRWezYEV3fTzI6Sr57 # ID do assistente
```

### 2. Criar Assistente no OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/assistants)
2. Clique em "Create"
3. Configure:
   - **Name**: "PetFlow Product Analyzer"
   - **Model**: gpt-4 (recomendado) ou gpt-3.5-turbo
   - **Instructions**: 
     ```
     Você é um especialista em análise de produtos para pet shops. 
     Quando receive o nome de um produto, extrai informações completas e detalhadas.
     
     Sempre retorne JSON válido com os seguintes campos:
     - nomeProduto: nome completo do produto
     - sku: código único em MAIÚSCULAS (formato: MARCA-TIPO-TAMANHO ou similar)
     - categoria: categoria do produto (Ração, Acessórios, Higiene, etc.)
     - marca: marca/fabricante do produto
     - descricao: descrição detalhada (50-200 caracteres)
     - precoSugerido: preço sugerido em BRL (use null se desconhecido)
     - custoEstimado: custo estimado em BRL (use null se desconhecido)
     - estoqueMinimoSugerido: quantidade mínima recomendada
     - unidade: unidade de venda (Unidade, Kg, G, ML, Pacote, etc.)
     - tags: array com 5-7 tags relevantes
     ```

4. Copie o ID do assistente (formato: `asst_...`)

## Funcionalidade

### Fluxo de Funcionamento

1. **Frontend**: Usuário digita nome do produto e clica "✨ Gerar com IA"
2. **Backend**: 
   - Cria um thread de conversa com o assistante
   - Envia o nome do produto
   - Aguarda resposta do assistente
   - Valida e sanitiza o JSON retornado
3. **Validação**: 
   - Se JSON inválido → tenta recuperar
   - Se ainda inválido → retorna valores padrão seguros
   - Nunca quebra a aplicação
4. **Frontend**: Preenche todos os campos do formulário automaticamente

### Exemplo de Uso

**Input**: 
```
"Ração Úmida P Gato Hypoallergenic Vet Life Pork e Potato 85g"
```

**Output**:
```json
{
  "nomeProduto": "Ração Úmida P Gato Hypoallergenic Vet Life Pork e Potato 85g",
  "sku": "VETLIFE-UMIDA-85G-GATO",
  "categoria": "Ração Úmida",
  "marca": "Vet Life",
  "descricao": "Ração úmida para gatos da linha Hypoallergenic da Vet Life com sabor Pork e Potato, especialmente formulada para oferecer uma dieta hipoalergênica que ajuda a manter a saúde digestiva e o bem-estar do seu gato. Embalagem prática de 85g, adequada para porções controladas.",
  "precoSugerido": null,
  "custoEstimado": null,
  "estoqueMinimoSugerido": 5,
  "unidade": "Unidade",
  "tags": [
    "ração úmida",
    "gato",
    "hipoalergênica",
    "Vet Life",
    "Pork",
    "Potato",
    "saúde digestiva"
  ]
}
```

## Validação de Segurança

### Sanitização

- ✅ Remove caracteres de controle
- ✅ Limita tamanho máximo de strings (500 caracteres)
- ✅ Valida tipos de dados com Zod
- ✅ Converte valores para tipos corretos

### Tratamento de Erros

Se a API:
- **Falhar**: Retorna valores padrão seguros
- **Retornar JSON inválido**: Tenta recuperar do texto
- **Retornar dados incompletos**: Preenche com valores padrão
- **Timeout/Erro de rede**: Retorna dados seguros, nunca quebra

### Valores Padrão

```typescript
{
  nomeProduto: "Produto sem nome",
  sku: "SKU-DEFAULT",
  categoria: "Outros",
  marca: "Genérica",
  descricao: "Sem descrição disponível",
  precoSugerido: null,
  custoEstimado: null,
  estoqueMinimoSugerido: 5,
  unidade: "Unidade",
  tags: ["produto"],
}
```

## API Endpoints

### generateAI (Endpoint tRPC)

**Rota**: `/api/trpc/products.generateAI`

**Método**: POST

**Input**:
```typescript
{
  productName: string // Obrigatório
}
```

**Output**:
```typescript
{
  nomeProduto: string;
  sku: string;
  categoria: string;
  marca: string;
  descricao: string;
  precoSugerido: number | null;
  custoEstimado: number | null;
  estoqueMinimoSugerido: number;
  unidade: string;
  tags: string[];
}
```

## Limitações e Considerações

### Rate Limiting
- OpenAI tem limites de requisições
- Implemente cache se necessário
- Considere usar a fila de requisições para picos

### Custo
- Cada requisição consome tokens da API OpenAI
- Estimar ~500-1000 tokens por produto
- Considere GPT-3.5-turbo para reduzir custos

### Tempo de Resposta
- Timeout configurado em 30 segundos
- Assistente geralmente responde em 2-5 segundos
- Adicione feedback visual de carregamento

## Troubleshooting

### "OPENAI_ASSISTANT_ID não configurada"
- Verifique se a variável de ambiente está configurada no `.env`
- Reinicie o servidor após adicionar a variável

### "OpenAI API error: 401"
- Chave API inválida ou expirada
- Verifique a chave no `.env`
- Gere uma nova chave se necessário

### "Timeout waiting for assistant response"
- Assistente levou mais de 30 segundos
- Aumentar timeout em `openaiAssistant.ts`
- Verificar status do assistente no OpenAI Platform

### JSON inválido retornado
- Sistema automaticamente trata como erro
- Retorna valores padrão seguros
- Verifique as instruções do assistente

## Próximas Melhorias

- [ ] Cache de resultados em banco de dados
- [ ] Fila de requisições para otimizar custos
- [ ] Suporte a múltiplos idiomas
- [ ] Extração de imagens de produtos
- [ ] Integração com APIs de fornecedores
- [ ] Atualização automática de preços