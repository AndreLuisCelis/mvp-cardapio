import { useState } from 'react';
import { CheckCircle2, Info, Pencil, Plus, Shield, Trash2, Users, X } from 'lucide-react';
import { BOOTSTRAP_ADMIN_EMAIL } from '../../../shared/firebase';
import {
  createStaffUserWithPassword,
  deleteStaffUserRecord,
  updateStaffUserPermissions,
} from '../../../shared/storeRepository';
import type { StaffUserRecord, StaffUserRole } from '../../../types';

interface UsersAdminViewProps {
  users: StaffUserRecord[];
  currentUserUid: string;
  isBootstrapAdmin: boolean;
  onRefresh: () => Promise<void>;
}

export function UsersAdminView({
  users,
  currentUserUid,
  isBootstrapAdmin,
  onRefresh,
}: UsersAdminViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUserRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffUserRecord | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<StaffUserRole>('editor');
  const [newCanManageUsers, setNewCanManageUsers] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetCreateForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('editor');
    setNewCanManageUsers(false);
    setErrorMsg(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 2) {
      setErrorMsg('Informe o nome completo do usuário.');
      return;
    }
    if (!newEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A senha inicial deve ter pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const effectiveRole: StaffUserRole = isBootstrapAdmin ? newRole : 'editor';
      const effectiveCanManageUsers = isBootstrapAdmin && effectiveRole === 'admin' ? newCanManageUsers : false;

      await createStaffUserWithPassword({
        email: newEmail.trim(),
        password: newPassword,
        displayName: newName.trim(),
        role: effectiveRole,
        canManageUsers: effectiveCanManageUsers,
        createdByUid: currentUserUid,
      });

      setShowCreateModal(false);
      resetCreateForm();
      setSuccessMsg(
        `Usuário ${newEmail.trim()} criado! Foi enviado um e-mail de confirmação para liberar o primeiro acesso.`
      );
      await onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        setErrorMsg('Este e-mail já está cadastrado no Firebase Auth.');
      } else if (msg.includes('operation-not-allowed')) {
        setErrorMsg('Ative o provedor E-mail/Senha no Firebase Console antes de criar usuários.');
      } else {
        setErrorMsg(msg || 'Não foi possível criar o usuário.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editingUser.displayName.trim().length < 2) {
      setErrorMsg('Informe o nome de exibição.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const effectiveRole: StaffUserRole = isBootstrapAdmin ? editingUser.role : 'editor';
      const effectiveCanManage =
        isBootstrapAdmin && effectiveRole === 'admin' ? editingUser.canManageUsers : false;

      await updateStaffUserPermissions(editingUser.uid, {
        displayName: editingUser.displayName,
        role: effectiveRole,
        canManageUsers: effectiveCanManage,
        active: editingUser.active,
      });
      setEditingUser(null);
      setSuccessMsg('Permissões do usuário atualizadas.');
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao atualizar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteStaffUserRecord(confirmDelete.uid);
      setConfirmDelete(null);
      setSuccessMsg(`Acesso de ${confirmDelete.email} removido do painel.`);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#0F172A]">Usuários e Permissões</h2>
          <p className="text-[13px] text-[#475569]">
            Adicione colaboradores para editar cardápio e loja. Apenas quem recebe a permissão pode gerenciar usuários.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Usuário</span>
        </button>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-[13px] text-[#334155]">
        <Info className="w-4 h-4 text-[#0F172A] shrink-0 mt-0.5" />
        <p>
          O administrador principal (<strong>{BOOTSTRAP_ADMIN_EMAIL}</strong>) sempre mantém acesso total e é o único que pode conceder ou revogar a permissão <strong>Gerenciar usuários</strong>.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[13px] text-[#15803D]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3">
          <Users className="w-7 h-7 text-[#64748B] mx-auto" />
          <p className="text-[15px] font-semibold text-[#0F172A]">Nenhum colaborador cadastrado</p>
          <p className="text-[13px] text-[#475569]">
            Adicione novos usuários com e-mail e senha para operar o painel sem acesso à gestão de equipe.
          </p>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-semibold text-[#475569]">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Papel</th>
                  <th className="py-3 px-4">Gerenciar Usuários</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {users.map((u) => {
                  const isOwner = u.email === BOOTSTRAP_ADMIN_EMAIL;
                  return (
                    <tr key={u.uid} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{u.displayName}</td>
                      <td className="py-3 px-4 text-[#334155] font-mono text-[12px]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-[#0F172A]">
                          {u.role === 'admin' && <Shield className="w-3.5 h-3.5 text-[#0F172A]" />}
                          {u.role === 'admin' ? 'Administrador' : 'Editor'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#334155]">
                        {u.canManageUsers || isOwner ? 'Permitido' : 'Sem permissão'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            u.active ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {u.active ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isOwner ? (
                          <span className="text-[12px] text-[#64748B]">Proprietário</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setErrorMsg(null);
                                setEditingUser({ ...u });
                              }}
                              className="p-1.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                              aria-label={`Editar ${u.displayName}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(u)}
                              className="p-1.5 text-[#475569] hover:text-[#DC2626] cursor-pointer ml-1"
                              aria-label={`Remover ${u.displayName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#0F172A]">Adicionar Novo Usuário</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {errorMsg && (
                <p className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]">
                  {errorMsg}
                </p>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#0F172A]">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Maria Souza"
                  className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#0F172A]">
                  E-mail de acesso *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colaborador@empresa.com"
                  className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#0F172A]">
                  Senha inicial *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
                />
              </div>

              {isBootstrapAdmin && (
                <div className="space-y-3 pt-1 border-t border-[#E2E8F0]">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-[#0F172A]">
                      Papel no painel
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => {
                        const role = e.target.value as StaffUserRole;
                        setNewRole(role);
                        if (role !== 'admin') setNewCanManageUsers(false);
                      }}
                      className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px] bg-white"
                    >
                      <option value="editor">Editor (edita cardápio, loja, logo e taxas)</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {newRole === 'admin' && (
                    <label className="flex items-start gap-2.5 text-[13px] text-[#0F172A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanManageUsers}
                        onChange={(e) => setNewCanManageUsers(e.target.checked)}
                        className="w-4 h-4 rounded mt-0.5"
                      />
                      <span>
                        <strong>Permitir adicionar e gerenciar outros usuários</strong> (role de gestão de equipe)
                      </span>
                    </label>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-[#CBD5E1] text-[13px] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#0F172A]">Editar Permissões</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              {errorMsg && (
                <p className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]">
                  {errorMsg}
                </p>
              )}

              <div className="space-y-1">
                <p className="text-[12px] font-semibold text-[#64748B]">E-mail</p>
                <p className="text-[13px] font-mono text-[#0F172A]">{editingUser.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#0F172A]">Nome *</label>
                <input
                  type="text"
                  required
                  value={editingUser.displayName}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, displayName: e.target.value } : null
                    )
                  }
                  className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
                />
              </div>

              {isBootstrapAdmin && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-[#0F172A]">Papel</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => {
                        const role = e.target.value as StaffUserRole;
                        setEditingUser((prev) =>
                          prev
                            ? {
                                ...prev,
                                role,
                                canManageUsers: role === 'admin' ? prev.canManageUsers : false,
                              }
                            : null
                        );
                      }}
                      className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px] bg-white"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {editingUser.role === 'admin' && (
                    <label className="flex items-start gap-2.5 text-[13px] text-[#0F172A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingUser.canManageUsers}
                        onChange={(e) =>
                          setEditingUser((prev) =>
                            prev ? { ...prev, canManageUsers: e.target.checked } : null
                          )
                        }
                        className="w-4 h-4 rounded mt-0.5"
                      />
                      <span>Permitir adicionar e gerenciar outros usuários</span>
                    </label>
                  )}
                </>
              )}

              <label className="flex items-center gap-2.5 text-[13px] font-medium text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingUser.active}
                  onChange={(e) =>
                    setEditingUser((prev) => (prev ? { ...prev, active: e.target.checked } : null))
                  }
                  className="w-4 h-4 rounded"
                />
                <span>Acesso ativo ao painel</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-[#CBD5E1] text-[13px] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Remover acesso?</h3>
            <p className="text-[13px] text-[#475569]">
              Deseja revogar permanentemente o acesso de <strong>{confirmDelete.displayName}</strong> ({confirmDelete.email})?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] text-[13px] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteUser}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#DC2626] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
