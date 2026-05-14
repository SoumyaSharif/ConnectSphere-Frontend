import {
  Component, OnInit, OnDestroy, signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { gsap } from 'gsap';

import { AdminService } from '../../../core/services/admin.service';
import {
  AdminDashboardStats,
  AdminUserSummary,
  AdminUserDetail,
  AdminUserFilters,
} from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  // ---- Tab state ----
  activeTab = signal<'OVERVIEW' | 'USERS'>('OVERVIEW');

  // ---- Dashboard stats ----
  stats = signal<AdminDashboardStats | null>(null);
  statsLoading = signal(true);
  statsError = signal<string | null>(null);

  // ---- User list ----
  users = signal<AdminUserSummary[]>([]);
  usersLoading = signal(false);
  usersError = signal<string | null>(null);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);

  // ---- Filters ----
  searchQuery = signal('');
  roleFilter = signal<'GUEST' | 'USER' | 'ADMIN' | ''>('');
  providerFilter = signal<'LOCAL' | 'GOOGLE' | ''>('');
  activeFilter = signal<boolean | ''>('');
  verifiedFilter = signal<boolean | ''>('');
  pageSize = 15;
  sortBy = signal('createdAt,desc');

  // ---- User detail drawer ----
  selectedUser = signal<AdminUserDetail | null>(null);
  drawerOpen = signal(false);
  drawerLoading = signal(false);

  // ---- Action states ----
  actionLoading = signal(false);
  confirmDelete = signal(false);
  pendingRoleChange = signal<'GUEST' | 'USER' | 'ADMIN' | null>(null);
  verificationApprovalLoading = signal(false);
  verificationApprovalDone = signal(false);
  verificationDenialLoading = signal(false);
  verificationDenialDone = signal(false);

  // ---- Computed ----
  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages() - 1);
  readonly hasPrevPage = computed(() => this.currentPage() > 0);

  ngOnInit(): void {
    this.loadStats();

    // Debounce search input
    this.searchChange$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(0);
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---- Tab navigation ----
  setTab(tab: 'OVERVIEW' | 'USERS'): void {
    this.activeTab.set(tab);
    if (tab === 'USERS' && this.users().length === 0) {
      this.loadUsers();
    }
    setTimeout(() => this.animateItems(), 50);
  }

  /** Quick-filter: show only users with verificationPending=true */
  showPendingVerifications(): void {
    this.activeTab.set('USERS');
    this.verifiedFilter.set(false);
    this.currentPage.set(0);
    this.loadUsers();
    setTimeout(() => this.animateItems(), 50);
  }

  // ---- Stats loading ----
  loadStats(): void {
    this.statsLoading.set(true);
    this.statsError.set(null);

    this.adminService.getDashboardStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.statsLoading.set(false);
        setTimeout(() => this.animateItems(), 50);
      },
      error: (err) => {
        this.statsError.set(err?.error?.message || 'Failed to load dashboard stats.');
        this.statsLoading.set(false);
      },
    });
  }

  // ---- User list loading ----
  loadUsers(): void {
    this.usersLoading.set(true);
    this.usersError.set(null);

    const filters: AdminUserFilters = {
      query: this.searchQuery() || undefined,
      role: this.roleFilter() || undefined,
      provider: this.providerFilter() || undefined,
      active: this.activeFilter() !== '' ? this.activeFilter() as boolean : undefined,
      verified: this.verifiedFilter() !== '' ? this.verifiedFilter() as boolean : undefined,
      page: this.currentPage(),
      size: this.pageSize,
      sort: this.sortBy(),
    };

    this.adminService.getUsers(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.users.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.usersLoading.set(false);
        setTimeout(() => this.animateItems(), 50);
      },
      error: (err) => {
        this.usersError.set(err?.error?.message || 'Failed to load users.');
        this.usersLoading.set(false);
      },
    });
  }

  // ---- Search / filter handlers ----
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchChange$.next(value);
  }

  applyFilter(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.providerFilter.set('');
    this.activeFilter.set('');
    this.verifiedFilter.set('');
    this.currentPage.set(0);
    this.loadUsers();
  }

  // ---- Pagination ----
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i);
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, current - half);
    let end = Math.min(total - 1, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // ---- Drawer ----
  openDrawer(userId: string): void {
    this.drawerOpen.set(true);
    this.drawerLoading.set(true);
    this.selectedUser.set(null);
    this.confirmDelete.set(false);
    this.pendingRoleChange.set(null);
    this.verificationApprovalLoading.set(false);
    this.verificationApprovalDone.set(false);
    this.verificationDenialLoading.set(false);
    this.verificationDenialDone.set(false);

    this.adminService.getUserDetail(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.selectedUser.set(user);
        this.drawerLoading.set(false);
      },
      error: () => {
        this.drawerLoading.set(false);
      },
    });
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.confirmDelete.set(false);
    this.pendingRoleChange.set(null);
    setTimeout(() => this.selectedUser.set(null), 300);
  }

  // ---- Role change ----
  initiateRoleChange(role: 'GUEST' | 'USER' | 'ADMIN'): void {
    this.pendingRoleChange.set(role);
  }

  confirmRoleChange(): void {
    const user = this.selectedUser();
    const role = this.pendingRoleChange();
    if (!user || !role) return;

    this.actionLoading.set(true);
    this.adminService.updateRole(user.userId, { role }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.selectedUser.update(u => u ? { ...u, role } : u);
        this.users.update(list => list.map(u => u.userId === user.userId ? { ...u, role } : u));
        this.pendingRoleChange.set(null);
        this.actionLoading.set(false);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to update role.');
        this.actionLoading.set(false);
        this.pendingRoleChange.set(null);
      },
    });
  }

  cancelRoleChange(): void {
    this.pendingRoleChange.set(null);
  }

  // ---- Status change ----
  toggleStatus(): void {
    const user = this.selectedUser();
    if (!user) return;

    const newActive = !user.isActive;
    this.actionLoading.set(true);
    this.adminService.updateStatus(user.userId, { active: newActive }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.selectedUser.update(u => u ? { ...u, isActive: newActive } : u);
        this.users.update(list => list.map(u => u.userId === user.userId ? { ...u, isActive: newActive } : u));
        this.actionLoading.set(false);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to update status.');
        this.actionLoading.set(false);
      },
    });
  }

  // ---- Delete ----
  requestDelete(): void {
    this.confirmDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmDelete.set(false);
  }

  executeDelete(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.actionLoading.set(true);
    this.adminService.deleteUser(user.userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.userId !== user.userId));
        this.totalElements.update(n => Math.max(0, n - 1));
        this.actionLoading.set(false);
        this.closeDrawer();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete user.');
        this.actionLoading.set(false);
        this.confirmDelete.set(false);
      },
    });
  }

  // ---- Approve Verification ----
  approveVerification(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.verificationApprovalLoading.set(true);
    this.adminService.approveVerification(user.userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Update the drawer + table row optimistically
        this.selectedUser.update(u => u ? { ...u, isVerified: true, verificationPending: false } : u);
        this.users.update(list =>
          list.map(u => u.userId === user.userId
            ? { ...u, isVerified: true, verificationPending: false }
            : u
          )
        );
        this.verificationApprovalLoading.set(false);
        this.verificationApprovalDone.set(true);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to approve verification.');
        this.verificationApprovalLoading.set(false);
      },
    });
  }

  denyVerification(): void {
    const user = this.selectedUser();
    if (!user) return;

    if (!confirm('Are you sure you want to deny this verification request? This will initiate a refund and block re-application for 7 days.')) return;

    this.verificationDenialLoading.set(true);
    this.adminService.denyVerification(user.userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const deniedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        // Update the drawer + table row optimistically
        this.selectedUser.update(u => u ? { ...u, isVerified: false, verificationPending: false, verificationDeniedUntil: deniedUntil } : u);
        this.users.update(list =>
          list.map(u => u.userId === user.userId
            ? { ...u, isVerified: false, verificationPending: false, verificationDeniedUntil: deniedUntil }
            : u
          )
        );
        this.verificationDenialLoading.set(false);
        this.verificationDenialDone.set(true);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to deny verification.');
        this.verificationDenialLoading.set(false);
      },
    });
  }

  isDenied(user: import('../../../core/models/admin.model').AdminUserDetail | null): boolean {
    if (!user?.verificationDeniedUntil) return false;
    return new Date(user.verificationDeniedUntil) > new Date();
  }

  formatRetryDate(user: import('../../../core/models/admin.model').AdminUserDetail | null): string {
    if (!user?.verificationDeniedUntil) return '';
    return new Date(user.verificationDeniedUntil).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  // ---- Formatting helpers ----
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  formatNumber(n: number | null | undefined): string {
    if (n === null || n === undefined) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }

  getInitial(user: AdminUserSummary | AdminUserDetail | null): string {
    if (!user) return '?';
    return (user.fullName || user.username || '?').charAt(0).toUpperCase();
  }

  minOf(a: number, b: number): number {
    return Math.min(a, b);
  }

  // ---- GSAP entrance ----
  private animateItems(): void {
    const els = document.querySelectorAll('.animate-item');
    if (els.length === 0) return;
    gsap.fromTo(els,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.38, stagger: 0.04, ease: 'power2.out' }
    );
  }
}
