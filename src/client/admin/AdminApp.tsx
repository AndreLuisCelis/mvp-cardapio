import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  Database,
  ExternalLink,
  FolderTree,
  LogOut,
  Menu,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  hasFirebaseConfig,
  testConnection,
} from '../../shared/firebase';
import {
  DEFAULT_STORE_SETTINGS,
  ensureBootstrapAdminRecord,
  fetchAdminWorkspaceData,
  fetchAllStaffUsers,
  seedInitialCatalogToFirestore,
  type AdminWorkspaceData,
} from '../../shared/storeRepository';
import type { StaffUserRecord } from '../../types';
import { AdminLoginView } from './AdminLoginView';
import { CategoriesAdminView } from './views/CategoriesAdminView';
import { DeliveryFeesAdminView } from './views/DeliveryFeesAdminView';
import { MenuItemsAdminView } from './views/MenuItemsAdminView';
import { OrdersAdminView } from './views/OrdersAdminView';
import { StoreSettingsAdminView } from './views/StoreSettingsAdminView';
import { UsersAdminView } from './views/UsersAdminView';

type AdminTab = 'orders' | 'menu' | 'categories' | 'store' | 'fees' | 'users';

interface AdminAppProps {
  showStorefrontLink?: boolean;
  onNavigateStorefront?: () => void;
}

export function AdminApp({ showStorefrontLink = true, onNavigateStorefront }: AdminAppProps) {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [staffRecord, setStaffRecord] = useState<StaffUserRecord | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('menu');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [workspace, setWorkspace] = useState<AdminWorkspaceData>({
    settings: DEFAULT_STORE_SETTINGS,
    categories: [],
    deliveryFees: [],
    menuItems: [],
    hasDatabaseSeed: false,
  });
  const [staffUsers, setStaffUsers] = useState<StaffUserRecord[]>([]);

  const isBootstrapAdmin =
    Boolean(firebaseUser?.emailVerified) &&
    firebaseUser?.email === BOOTSTRAP_ADMIN_EMAIL;

  const canManageUsers =
    isBootstrapAdmin ||
    Boolean(
      staffRecord?.active &&
        staffRecord.role === 'admin' &&
        staffRecord.canManageUsers
    );

  const isAuthorized =
    Boolean(firebaseUser?.emailVerified) &&
    (isBootstrapAdmin || Boolean(staffRecord && staffRecord.active));

  const loadWorkspace = useCallback(
    async (canListUsers: boolean) => {
      setLoadingWorkspace(true);
      setWorkspaceError(null);
      try {
        const data = await fetchAdminWorkspaceData();
        setWorkspace(data);
        if (canListUsers) {
          const usersList = await fetchAllStaffUsers();
          setStaffUsers(usersList);
        }
      } catch (err) {
        setWorkspaceError(
          err instanceof Error ? err.message : 'Não foi possível carregar os dados do painel.'
        );
      } finally {
        setLoadingWorkspace(false);
      }
    },
    []
  );

  const resolveStaffAndWorkspace = useCallback(
    async (user: User | null) => {
      if (!user || !user.emailVerified) {
        setStaffRecord(null);
        return;
      }

      setLoadingWorkspace(true);
      setWorkspaceError(null);
      try {
        const record = await ensureBootstrapAdminRecord(user);
        setStaffRecord(record);
        const userIsBootstrap = user.email === BOOTSTRAP_ADMIN_EMAIL;
        const userCanAccess = userIsBootstrap || Boolean(record && record.active);
        const userCanManage =
          userIsBootstrap ||
          Boolean(record && record.active && record.role === 'admin' && record.canManageUsers);

        if (userCanAccess) {
          await loadWorkspace(userCanManage);
        }
      } catch (err) {
        setWorkspaceError(
          err instanceof Error ? err.message : 'Erro ao verificar permissões do usuário.'
        );
      } finally {
        setLoadingWorkspace(false);
      }
    },
    [loadWorkspace]
  );

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setAuthReady(true);
      return;
    }

    testConnection().catch(() => undefined);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      resolveStaffAndWorkspace(user).catch(() => undefined);
    });

    return () => unsubscribe();
  }, [resolveStaffAndWorkspace]);

  const handleRefreshVerification = async () => {
    if (!auth?.currentUser) return;
    await auth.currentUser.reload();
    const updatedUser = auth.currentUser;
    setFirebaseUser(updatedUser ? ({ ...updatedUser } as User) : null);
    if (updatedUser?.emailVerified) {
      await resolveStaffAndWorkspace(updatedUser);
    }
  };

  const handleSeedInitialCatalog = async () => {
    setSeeding(true);
    try {
      await seedInitialCatalogToFirestore();
      await loadWorkspace(canManageUsers);
    } finally {
      setSeeding(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-3 animate-pulse">
          <div className="h-5 w-40 bg-[#E2E8F0] rounded" />
          <div className="h-10 w-full bg-[#F1F5F9] rounded" />
          <div className="h-10 w-full bg-[#F1F5F9] rounded" />
        </div>
      </div>
    );
  }

  if (!hasFirebaseConfig || !firebaseUser) {
    return (
      <AdminLoginView
        currentUser={null}
        showStorefrontLink={showStorefrontLink}
        onNavigateStorefront={onNavigateStorefront}
      />
    );
  }

  if (!firebaseUser.emailVerified) {
    return (
      <AdminLoginView
        currentUser={firebaseUser}
        needsEmailVerification
        onRefreshVerification={handleRefreshVerification}
        showStorefrontLink={showStorefrontLink}
        onNavigateStorefront={onNavigateStorefront}
      />
    );
  }

  if (!loadingWorkspace && !isAuthorized) {
    return (
      <AdminLoginView
        currentUser={firebaseUser}
        isUnauthorized
        showStorefrontLink={showStorefrontLink}
        onNavigateStorefront={onNavigateStorefront}
      />
    );
  }

  const navItems: { id: AdminTab; label: string; icon: typeof UtensilsCrossed }[] = [
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'menu', label: 'Cardápio', icon: UtensilsCrossed },
    { id: 'categories', label: 'Categorias', icon: FolderTree },
    { id: 'store', label: 'Loja & Logo', icon: Store },
    { id: 'fees', label: 'Taxas de Entrega', icon: Truck },
    ...(canManageUsers ? [{ id: 'users' as AdminTab, label: 'Usuários', icon: Users }] : []),
  ];

  const activeNavTitle = navItems.find((i) => i.id === activeTab)?.label || 'Cardápio';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E2E8F0]">
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {workspace.settings.logoUrl ? (
            <img
              src={workspace.settings.logoUrl}
              alt={workspace.settings.name}
              className="w-9 h-9 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
              {workspace.settings.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#0F172A] truncate">
              {workspace.settings.name}
            </p>
            <p className="text-[11px] font-medium text-[#64748B] truncate">
              Painel Administrativo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-[#64748B] cursor-pointer"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0F172A] text-white'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#E2E8F0] space-y-2">
        <div className="px-2 py-1.5">
          <p className="text-[12px] font-semibold text-[#0F172A] truncate">
            {staffRecord?.displayName || firebaseUser.displayName || firebaseUser.email}
          </p>
          <p className="text-[11px] text-[#64748B] truncate">
            {canManageUsers ? 'Administrador · Gestão total' : 'Editor · Cardápio e Loja'}
          </p>
        </div>

        {showStorefrontLink && onNavigateStorefront && (
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateStorefront();
            }}
            className="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[12px] font-semibold text-[#334155] flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Cardápio Público</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => auth && signOut(auth)}
          className="w-full min-h-[36px] px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair do Painel</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[256px] shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[264px] max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
              aria-label="Abrir navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-[13px] min-w-0">
              <span className="text-[#64748B] truncate">{workspace.settings.name}</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#0F172A] truncate">{activeNavTitle}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadWorkspace(canManageUsers)}
            disabled={loadingWorkspace}
            className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[12px] font-semibold text-[#334155] whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {loadingWorkspace ? 'Atualizando...' : 'Atualizar'}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">
          {workspaceError && (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]">
              {workspaceError}
            </div>
          )}

          {!loadingWorkspace && !workspace.hasDatabaseSeed && (
            <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-[#0F172A] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h2 className="text-[15px] font-bold text-[#0F172A]">
                    Banco de dados pronto para importação inicial
                  </h2>
                  <p className="text-[13px] text-[#475569]">
                    Clique ao lado para gravar no Firestore os 54 produtos, 7 categorias, taxas e configurações iniciais da loja.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedInitialCatalog}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {seeding ? 'Importando...' : 'Importar Cardápio Inicial'}
              </button>
            </div>
          )}

          {loadingWorkspace && workspace.menuItems.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 space-y-3 animate-pulse">
              <div className="h-5 w-48 bg-[#E2E8F0] rounded" />
              <div className="h-10 w-full bg-[#F1F5F9] rounded" />
              <div className="h-10 w-full bg-[#F1F5F9] rounded" />
              <div className="h-10 w-full bg-[#F1F5F9] rounded" />
            </div>
          ) : (
            <>
              {activeTab === 'orders' && <OrdersAdminView />}
              {activeTab === 'menu' && (
                <MenuItemsAdminView
                  items={workspace.menuItems}
                  categories={workspace.categories}
                  onRefresh={() => loadWorkspace(canManageUsers)}
                />
              )}
              {activeTab === 'categories' && (
                <CategoriesAdminView
                  categories={workspace.categories}
                  onRefresh={() => loadWorkspace(canManageUsers)}
                />
              )}
              {activeTab === 'store' && (
                <StoreSettingsAdminView
                  settings={workspace.settings}
                  onRefresh={() => loadWorkspace(canManageUsers)}
                />
              )}
              {activeTab === 'fees' && (
                <DeliveryFeesAdminView
                  fees={workspace.deliveryFees}
                  onRefresh={() => loadWorkspace(canManageUsers)}
                />
              )}
              {activeTab === 'users' && canManageUsers && (
                <UsersAdminView
                  users={staffUsers}
                  currentUserUid={firebaseUser.uid}
                  isBootstrapAdmin={isBootstrapAdmin}
                  onRefresh={() => loadWorkspace(canManageUsers)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
