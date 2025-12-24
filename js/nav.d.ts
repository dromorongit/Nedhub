export declare function initNavigation(): void;
declare function toggleMobileMenu(isOpen: boolean, navMenu: HTMLElement, mobileMenuBtn: HTMLElement, navbar: HTMLElement): void;
declare function setActiveNavLink(): void;
declare function trapFocus(element: HTMLElement): void;
declare function releaseFocusTrap(): void;
declare function getFocusableElements(container: HTMLElement): HTMLElement[];
export { toggleMobileMenu, setActiveNavLink, trapFocus, releaseFocusTrap, getFocusableElements };
