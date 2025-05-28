import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-success-modal',
    templateUrl: './success-modal.component.html',
    styleUrls: ['./success-modal.component.scss'],
    standalone: true,
    imports: []
})
export class SuccessModalComponent {
    @Input() message: string = '¡Operación exitosa!';
    @Output() onClose = new EventEmitter<void>();

    close(): void {
        this.onClose.emit();
    }
}