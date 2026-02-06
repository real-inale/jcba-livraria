# 🔍 Diagnóstico e Correção: Problema de Registro de Vendedores

## 📋 Problema Reportado

Quando um usuário cria uma conta de vendedor, a interface mostra opções de cliente normal em vez de vendedor.

## 🔎 Root Cause Analysis (Systematic Debugging)

### **Fase 1: Investigation**

#### Evidências coletadas:
1. ✅ O código em `AuthPage.tsx` adiciona a role 'seller' após criar o perfil
2. ✅ O trigger `handle_new_user()` adiciona automaticamente a role 'client'
3. ❌ O `refreshProfile()` pode não estar sendo chamado no momento certo
4. ❌ A inserção da role de vendedor pode estar falhando silenciosamente

#### Suspeitas:
- **Timing Issue**: O `refreshProfile()` pode estar sendo chamado antes das inserções completarem
- **Database Constraints**: Pode haver problemas com constraints de unicidade
- **RLS Policies**: As policies podem estar bloqueando a inserção de roles

### **Fase 2: Pattern Analysis**

Análise do fluxo atual:
```
1. signUp() é chamado → cria user na tabela auth.users
2. Trigger handle_new_user() executa → cria profile + role 'client'
3. setTimeout(1000) → aguarda
4. seller_profile é inserido
5. role 'seller' é inserida
6. refreshProfile() é chamado
```

**Problemas identificados:**
- ⏱️ 1 segundo pode não ser suficiente para o trigger completar
- 🚫 Erros na inserção de role não são tratados adequadamente
- 🔍 Sem logs para debug em produção

## ✅ Solução Implementada

### Alterações em `AuthPage.tsx`:

1. **Aumento do timeout**: `1000ms → 2000ms`
   - Garante que o trigger complete antes de continuar

2. **Logs detalhados** adicionados:
   ```typescript
   console.log('[SellerSignup] User ID:', session.user.id);
   console.log('[SellerSignup] Seller profile created:', sellerData);
   console.log('[SellerSignup] Seller role added:', roleData);
   console.log('[SellerSignup] User roles after creation:', verifyRoles);
   ```

3. **Tratamento robusto de erros**:
   - Verifica se erro é de duplicação (23505)
   - Apenas mostra erro se não for duplicação
   - Continua o fluxo mesmo com duplicação

4. **Verificação de roles**:
   - Adiciona query para verificar roles após inserção
   - Log mostra todas as roles do usuário

5. **Chamadas com `.select()`**:
   - Garante que dados são retornados para validação
   - Facilita debugging

## 🧪 Como Testar

### Passo 1: Abrir Console do Navegador
```
F12 → Console tab
```

### Passo 2: Criar Conta de Vendedor
1. Acesse `/auth?mode=signup`
2. Clique em "Criar Conta de Vendedor"
3. Preencha o formulário:
   - Nome completo
   - Email
   - Senha
   - Nome da loja
   - Descrição da loja
4. Clique em "Criar Conta de Vendedor"

### Passo 3: Verificar Logs
Você deverá ver no console:
```
[SellerSignup] User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[SellerSignup] Seller profile created: { id: '...', user_id: '...', store_name: '...', ... }
[SellerSignup] Seller role added: [{ id: '...', user_id: '...', role: 'seller' }]
[SellerSignup] User roles after creation: [{ role: 'client' }, { role: 'seller' }]
```

### Passo 4: Verificar no Banco (Opcional)
Via Supabase Dashboard → SQL Editor:
```sql
-- Substitua USER_ID pelo ID do console
SELECT 
  p.full_name,
  p.email,
  ur.role,
  sp.store_name,
  sp.status
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN seller_profiles sp ON p.id = sp.user_id
WHERE p.id = 'USER_ID';
```

**Resultado esperado:**
| full_name | email | role | store_name | status |
|-----------|-------|------|------------|--------|
| João Silva | joao@exemplo.com | client | Livraria João | pending |
| João Silva | joao@exemplo.com | seller | Livraria João | pending |

### Passo 5: Verificar Interface
Após login, o menu deve mostrar:
- ✅ "Painel do Vendedor" (se `isSeller === true`)
- ✅ Opções de cliente (porque também tem role 'client')

## 🚨 Possíveis Problemas e Soluções

### Problema 1: Role 'seller' não é adicionada
**Causa provável**: RLS policy bloqueando inserção

**Solução**:
```sql
-- Verificar policy em user_roles
SELECT * FROM pg_policies WHERE tablename = 'user_roles';

-- Adicionar policy se necessário
CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Problema 2: `isSeller` continua false
**Causa provável**: `refreshProfile()` não está atualizando roles

**Solução temporária**: Fazer logout e login novamente

**Solução permanente**: Verificar `AuthContext.tsx`:
```typescript
// Deve buscar roles assim:
const { data: rolesData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);
```

### Problema 3: Erro "duplicate key value"
**Diagnóstico**: Usuário já tem role 'seller'

**Ação**: Isso é normal se estiver retestando - a role já existe!

## 🎯 Próximos Passos

1. **Testar o registro de vendedor**
2. **Verificar se `isSeller` está true**
3. **Verificar se o menu mostra "Painel do Vendedor"**
4. **Verificar se pode acessar `/vendedor`**
5. **Se tudo funcionar**: Remover logs de console para produção

## 📝 Notas

- Os logs são temporários - remover antes de deploy final
- O tempo de 2 segundos pode ser ajustado se necessário
- A conta de vendedor fica em status 'pending' até aprovação do admin
