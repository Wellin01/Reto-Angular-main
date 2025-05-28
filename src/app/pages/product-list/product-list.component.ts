import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

  activeMenuId: string | null = null;

  toggleMenu(productId: string): void {
    this.activeMenuId = this.activeMenuId === productId ? null : productId;
  }

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];

  searchText: string = '';
  itemsToShow: number = 5;
  defaultLogo: string = 'https://www.visa.com.ec/dam/VCOM/regional/lac/SPA/Default/Pay%20With%20Visa/Tarjetas/visa-signature-400x225.jpg';
  constructor(
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.obtenerProduct().subscribe((productos) => {
      this.allProducts = productos;
      this.applyFilters();
    });
  }

  goToAddProduct(): void {
    this.router.navigate(['/agregar']);
  }

  editProduct(id: string): void {
    this.router.navigate(['/editar', id]);
  }

  deleteProduct(id: string): void {
    const confirmar = confirm('¿Estás seguro de eliminar este producto?');

    if (confirmar) {
      this.productService.deleteProduct(id).subscribe(() => {
        alert('Producto eliminado exitosamente.');
        this.loadProducts();
      });
    }
  }

  showModal: boolean = false;
  productToDeleteId: string | null = null;

  confirmDelete(productId: string): void {
    this.productToDeleteId = productId;
    this.showModal = true;
  }

  handleCancel(): void {
    this.showModal = false;
    this.productToDeleteId = null;
  }

  handleConfirm(): void {
    if (this.productToDeleteId) {
      this.productService.deleteProduct(this.productToDeleteId).subscribe(() => {
        this.loadProducts();
        this.showModal = false;
        this.productToDeleteId = null;
      });
    }
  }

  onLogoError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultLogo;
  }

  formatDate(dateString: string): string {
    if (!dateString || !dateString.includes('-')) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  currentPage: number = 1;
  itemsPerPage: number = 5;
  paginatedProducts: Product[] = [];

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
    }
  }

  updatePaginatedProducts(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
  }
  applyFilters(): void {
    const search = this.searchText.toLowerCase();
    this.filteredProducts = this.allProducts.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );

    this.currentPage = 1;
    this.updatePaginatedProducts();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePaginatedProducts();
  }

}