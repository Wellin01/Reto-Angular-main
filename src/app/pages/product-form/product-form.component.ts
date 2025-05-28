import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { SuccessModalComponent } from '../../components/success-modal/success-modal.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SuccessModalComponent],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  editing: boolean = false;
  productId: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    this.editing = !!this.productId;

    this.productForm = this.fb.group({
      id: this.fb.control(
        { value: '', disabled: this.editing },
        {
          validators: [Validators.required, Validators.minLength(3), Validators.maxLength(10)],
          asyncValidators: this.editing ? [] : [this.idNotExistsValidator()],
          updateOn: 'change'
        }
      ),
      name: this.fb.control(
        { value: '', disabled: false },
        {
          validators: [Validators.required, Validators.minLength(5), Validators.maxLength(100)],
          asyncValidators: this.editing ? [] : [this.idNotExistsValidator()],
          updateOn: 'change'
        }),
      description: this.fb.control(
        { value: '', disabled: false },
        {
          validators: [Validators.required, Validators.minLength(10), Validators.maxLength(200)],
          asyncValidators: this.editing ? [] : [this.idNotExistsValidator()],
          updateOn: 'change'
        }),
      logo: ['', Validators.required],
      date_release: ['', [Validators.required, this.releaseDateValidator()]],
      date_revision: [{ value: '', disabled: true }, Validators.required]
    }, {
      validators: [this.dateRangeValidator()]
    });

    this.productForm.get('date_release')?.valueChanges.subscribe((releaseDateStr: string) => {
      if (!releaseDateStr) return;

      const [year, month, day] = releaseDateStr.split('-').map(Number);
      const revisionDate = new Date(year + 1, month - 1, day);
      const revYear = revisionDate.getFullYear();
      const revMonth = String(revisionDate.getMonth() + 1).padStart(2, '0');
      const revDay = String(revisionDate.getDate()).padStart(2, '0');
      const revisionStr = `${revYear}-${revMonth}-${revDay}`;

      this.productForm.get('date_revision')?.setValue(revisionStr, { emitEvent: false });
    });

    this.productForm.get('date_release')?.valueChanges.subscribe(value => {
      const control = this.productForm.get('date_revision');

      if (this.productForm.get('date_release')?.valid) {
        control?.enable();
      } else {
        control?.disable();
        control?.reset();
      }
    });

    if (this.editing) {
      this.productService.getProductById(this.productId).subscribe(product => {
        const { id, ...rest } = product;
        this.productForm.patchValue(rest);
        this.productForm.get('id')?.setValue(id);
      });
    }
  }

  showSuccessModal = false;
  successMessage = '';

  onSubmit(): void {
    if (this.productForm.valid) {
      const productData = this.productForm.getRawValue();

      if (this.editing) {
        this.productService.updateProduct(this.productId, productData).subscribe(() => {
          this.successMessage = 'Producto actualizado correctamente.';
          this.showSuccessModal = true;
        });
      } else {
        this.productService.createProduct(productData).subscribe(() => {
          this.successMessage = 'Producto creado correctamente.';
          this.showSuccessModal = true;
        });
      }

    } else {
      this.productForm.markAllAsTouched();
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  resetForm(): void {
    this.productForm.reset();
  }

  dateRangeValidator(): ValidatorFn {
    return (form: AbstractControl): ValidationErrors | null => {
      const release = form.get('date_release')?.value;
      const revision = form.get('date_revision')?.value;
      if (!release || !revision) return null;

      const [rYear, rMonth, rDay] = release.split('-').map(Number);
      const expected = new Date(rYear + 1, rMonth - 1, rDay);

      const [revYear, revMonth, revDay] = revision.split('-').map(Number);
      const actual = new Date(revYear, revMonth - 1, revDay);

      const expectedStr = expected.toISOString().split('T')[0];
      const actualStr = actual.toISOString().split('T')[0];

      return expectedStr === actualStr ? null : { revisionDateInvalid: true };
    };
  }

  releaseDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value;
      if (!value) return null;
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      const todayStr = `${year}-${month}-${day}`;

      return value >= todayStr ? null : { releaseDateInvalid: true };
    };
  }

  idNotExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      return this.productService.verifyIdExists(control.value).pipe(
        map(exists => exists ? { idExists: true } : null)
      );
    };
  }

  onModalClose(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/']);
  }
}

