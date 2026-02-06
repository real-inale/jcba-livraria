# Instruções de Migração do Banco de Dados

## Arquivo de Migração
`migrations/update_schema_v2.sql`

## O que esta migração adiciona:

### Novas Tabelas:
1. **notifications** - Sistema de notificações para usuários
2. **payment_settings** - Configurações de métodos de pagamento
3. **digital_purchases** - Rastreamento de compras digitais e downloads
4. **cart_items** - Carrinho de compras dos usuários
5. **platform_settings** - Configurações gerais da plataforma

### Novas Colunas:
- `orders.payment_method` - Método de pagamento usado no pedido
- `orders.payment_proof_url` - URL do comprovante de pagamento

### Funções:
- `generate_order_number()` - Gera números únicos de pedido no formato LA{YYYYMMDD}{RANDOM}

### Índices de Performance:
- Índices em `books`, `orders`, `order_items`, `cart_items`, `notifications` e `seller_profiles`
- Melhoram a performance de queries frequentes

### Seed Data:
- Métodos de pagamento padrão (Multicaixa Express, ATM Reference)
- Categorias padrão (Romance, Técnico, Infantil, Biografias, Acadêmico)

## Como Aplicar a Migração:

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Copie todo o conteúdo de `migrations/update_schema_v2.sql`
5. Cole no editor SQL
6. Clique em **Run** para executar

### Opção 2: Via CLI local
```bash
# Se tiver o Supabase CLI instalado
supabase db push
```

### Opção 3: Via Supabase CLI remoto
```bash
# Execute o SQL diretamente
supabase db execute migrations/update_schema_v2.sql --project-ref SEU_PROJECT_REF
```

## Verificação Pós-Migração:

Execute estas queries no SQL Editor para verificar:

```sql
-- Verificar novas tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'payment_settings', 'digital_purchases', 'cart_items', 'platform_settings');

-- Verificar função
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_order_number';

-- Contar categorias seed
SELECT COUNT(*) as total_categories FROM public.categories;

-- Verificar policies RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'payment_settings', 'cart_items');
```

## Rollback (se necessário):

Caso precise reverter, execute:

```sql
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.digital_purchases CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payment_settings CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;

ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_method;
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_proof_url;

DROP FUNCTION IF EXISTS generate_order_number();
```

## Notas Importantes:
- ✅ Esta migração é **idempotente** (pode ser executada múltiplas vezes sem erro)
- ✅ Usa `IF NOT EXISTS` para evitar conflitos
- ✅ Todas as tabelas têm Row Level Security (RLS) habilitado
- ✅ Índices melhoram performance sem quebrar funcionalidades existentes
