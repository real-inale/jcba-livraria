# 👑 Guia de Administração - Livraria JCBA

Este guia explica como gerenciar usuários administradores e acessar o painel de controle do sistema.

## 🚀 Rotas Administrativas

O painel administrativo está protegido e só pode ser acessado por usuários com a role `admin`.

**URL do Projeto (Temporária):**
`https://darksalmon-alligator-648948.hostingersite.com/`

### 🔗 Links Importantes

*   **Painel Principal:** `/admin`
    *   URL Completa: `https://darksalmon-alligator-648948.hostingersite.com/admin`
*   **Revisão de Livros (Rota Secreta):** `/admin/revisao-livros`
    *   URL Completa: `https://darksalmon-alligator-648948.hostingersite.com/admin/revisao-livros`
    *   *Use esta rota para aprovar ou rejeitar livros enviados por vendedores.*

---

## 🛡️ Como Tornar um Usuário "Super Admin"

Como o sistema de cadastro padrão cria apenas usuários do tipo `client` ou `seller`, você precisa promover manualmente o seu usuário para `admin` através do banco de dados (Supabase).

### Passo a Passo:

1.  **Crie uma conta** no site normalmente (como Cliente ou Vendedor).
2.  Acesse o **Painel do Supabase**: [https://supabase.com/dashboard/project/eaxxizlgxojgjrzvkbbm](https://supabase.com/dashboard/project/eaxxizlgxojgjrzvkbbm)
3.  Vá até a aba **SQL Editor** (ícone de terminal na barra lateral).
4.  Clique em **New Query**.
5.  Copie e cole o código abaixo (substituindo pelo seu email de cadastro):

```sql
-- Promover usuário a ADMIN
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'SEU_EMAIL_AQUI@GMAIL.COM'  -- <--- Coloque seu email aqui
ON CONFLICT (user_id, role) DO NOTHING;
```

6.  Clique em **Run** (botão verde).

### ✅ Verificação

Após rodar o comando, faça logout e login novamente no site. Ao tentar acessar `https://darksalmon-alligator-648948.hostingersite.com/admin`, você deverá ter acesso total.
