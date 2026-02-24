# Configuração da IA (GPT) para Geração de Produtos

## Como Funciona

O sistema usa IA para gerar automaticamente informações completas de produtos baseado apenas no nome. A funcionalidade inclui:

- **SKU automático**: Geração de código único baseado no nome e categoria
- **Descrição otimizada**: Texto persuasivo para vendas
- **Tags relevantes**: Palavras-chave para busca e categorização
- **Categoria sugerida**: Classificação automática do produto
- **Preço sugerido**: Valor realista baseado no mercado brasileiro
- **Unidade de venda**: Sugestão de embalagem apropriada
- **Animais-alvo**: Identificação dos pets compatíveis

## Configuração

### 1. API da Forge/OpenAI

Para usar a funcionalidade de IA, você precisa configurar uma API compatível. O sistema atualmente usa a API da Forge.

Adicione ao arquivo `.env`:

```env
BUILT_IN_FORGE_API_URL=https://sua-api-endpoint.com
BUILT_IN_FORGE_API_KEY=sua_api_key_aqui
```

### 2. Como Usar no Sistema

1. Na página de Produtos, clique em "Novo Produto"
2. Digite apenas o nome do produto (ex: "Ração Premium para Cães Adultos")
3. Clique no botão "✨ Gerar com IA"
4. O sistema irá preencher automaticamente:
   - SKU único
   - Descrição persuasiva
   - Tags relevantes
   - Categoria apropriada
   - Preço sugerido
   - Unidade de venda

### 3. Exemplo de Uso

**Input**: "Shampoo Antípulgas para Gatos"

**Output gerado**:
- SKU: HIG-SHAM-AB12
- Descrição: "Shampoo especializado para gatos com fórmula antípulgas que elimina parasitas externos de forma segura e eficaz."
- Tags: "shampoo, antipulgas, gatos, higiene, parasitas"
- Categoria: "Higiene"
- Preço sugerido: R$ 45,90
- Unidade: "un"
- Animais-alvo: "gatos"

## API Endpoints

- `POST /api/trpc/products.generateAI` - Gera informações do produto via IA

**Parâmetros**:
```json
{
  "productName": "Nome do produto",
  "category": "Categoria opcional",
  "brand": "Marca opcional"
}
```

**Resposta**:
```json
{
  "sku": "PET-NOME-AB12",
  "description": "Descrição gerada...",
  "tags": "tag1, tag2, tag3",
  "category": "Categoria sugerida",
  "suggestedPrice": 29.90,
  "unit": "un",
  "targetAnimals": "cachorros, gatos"
}
```

## Personalização

O prompt da IA pode ser ajustado no arquivo `server/routers.ts` na rota `generateAI` para:
- Alterar o estilo das descrições
- Modificar categorias disponíveis
- Ajustar faixa de preços
- Personalizar para seu mercado específico