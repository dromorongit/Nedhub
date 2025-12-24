export declare function initFormValidation(): void;
declare function validateForm(form: HTMLFormElement): boolean;
declare function validateField(field: HTMLInputElement | HTMLTextAreaElement): boolean;
declare function validateEmail(email: string): boolean;
declare function showFieldError(field: HTMLInputElement | HTMLTextAreaElement, message: string): void;
declare function clearFieldError(field: HTMLInputElement | HTMLTextAreaElement): void;
declare function getFormData(form: HTMLFormElement): Record<string, string>;
export { validateForm, validateField, validateEmail, showFieldError, clearFieldError, getFormData };
