import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';
import { AuthApi } from '../../../features/security/data-access/auth-api';
import { LucideChevronDown, LucideLogOut } from '@lucide/angular';
import { concatMap, tap } from 'rxjs';

@Component({
  imports: [RouterLink, Logo, LucideChevronDown, LucideLogOut],
  selector: 'app-navbar',
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly authService = inject(AuthApi);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly showUserDropdown = signal<boolean>(false);

  onClickUserDropdown() {
    this.showUserDropdown.set(!this.showUserDropdown());
  }

  onClickLogout() {
    this.authService
      .logout()
      .pipe(
        tap(() => {
          this.authService.currentUser.set(null);
          this.showUserDropdown.set(false);
        }),
        concatMap(() => this.authService.csrf()),
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/login', { replaceUrl: true });
        },
        error: (e) => {
          throw e;
        },
      });
  }
}
