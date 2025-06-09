// CONSTANTES
const CARRITO_KEY = 'carritoAquaGT';

// CLASE DEL CARRITO
class Carrito {
  constructor() {
    this.cart = this.loadCart();
    this.init();
  }

  init() {
    this.initEventListeners();
    this.updateCartCount();
    this.setupStorageListener();
  }

  loadCart() {
    try {
      const cartData = localStorage.getItem(CARRITO_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(CARRITO_KEY, JSON.stringify(this.cart));
      this.updateCartCount();
    } catch (error) {
      console.error('Error al guardar el carrito:', error);
    }
  }

  addItem(product) {
    const existingItem = this.cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.cantidad += 1;
    } else {
      this.cart.push({
        id: product.id,
        nombre: product.nombre,
        precio: parseFloat(product.precio),
        cantidad: 1,
        imagen: product.imagen || ''
      });
    }
    
    this.saveCart();
    this.showNotification(`${product.nombre} añadido al carrito`);
    return this.cart;
  }

  updateQuantity(productId, newQuantity) {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) {
      this.showNotification('Cantidad inválida', 'error');
      return false;
    }

    const item = this.cart.find(item => item.id === productId);
    if (item) {
      item.cantidad = quantity;
      this.saveCart();
      return true;
    }
    return false;
  }

  removeItem(productId) {
    const initialLength = this.cart.length;
    this.cart = this.cart.filter(item => item.id !== productId);
    
    if (this.cart.length < initialLength) {
      this.saveCart();
      this.showNotification('Producto eliminado');
      return true;
    }
    return false;
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.showNotification('Carrito vaciado correctamente');
    this.renderCartItems();
    return true;
  }

  getTotal() {
    return this.cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  updateCartCount() {
    const totalItems = this.cart.reduce((sum, item) => sum + item.cantidad, 0);
    const countElements = document.querySelectorAll('#cart-count');
    
    countElements.forEach(el => {
      el.textContent = totalItems;
    });
  }

  renderCartItems() {
    const tbody = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (this.cart.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay productos en el carrito.</td></tr>';
      if (totalElement) totalElement.textContent = 'Q0.00';
      return;
    }

    this.cart.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-2 py-2">${item.nombre}</td>
        <td class="text-center px-2 py-2">Q${item.precio.toFixed(2)}</td>
        <td class="text-center px-2 py-2">
          <input type="number" min="1" value="${item.cantidad}" 
                 class="w-16 text-center border rounded quantity-input" 
                 data-id="${item.id}" />
        </td>
        <td class="text-right px-2 py-2">Q${subtotal.toFixed(2)}</td>
        <td class="text-center px-2 py-2">
          <button class="text-red-600 hover:text-red-800 font-bold text-lg remove-item" 
                  data-id="${item.id}">&times;</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (totalElement) {
      totalElement.textContent = `Q${this.getTotal().toFixed(2)}`;
    }
  }

  initEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.remove-item')) {
        const button = e.target.closest('.remove-item');
        const productId = button.dataset.id;
        
        if (productId) {
          if (this.removeItem(productId)) {
            this.renderCartItems();
          }
        }
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('quantity-input')) {
        const productId = e.target.dataset.id;
        const newQuantity = e.target.value;
        this.updateQuantity(productId, newQuantity);
        this.renderCartItems();
      }
    });
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === CARRITO_KEY) {
        this.cart = this.loadCart();
        this.updateCartCount();
        if (document.getElementById('cart-modal') && !document.getElementById('cart-modal').classList.contains('hidden')) {
          this.renderCartItems();
        }
      }
    });
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg 
      ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white 
      flex items-center transform translate-x-full opacity-0 
      transition-all duration-300 ease-in-out`;
    
    notification.innerHTML = `
      <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="${type === 'success' ? 'M5 13l4 4L19 7' : type === 'error' ? 'M6 18L18 6M6 6l12 12' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
      </svg>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('translate-x-0', 'opacity-100');
      notification.classList.add('translate-x-full', 'opacity-0');
      
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  openCartModal() {
    this.renderCartItems();
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.add('hidden');
  }

  finalizeOrder() {
    if (this.cart.length === 0) {
      this.showNotification('Tu carrito está vacío', 'error');
      return;
    }

    const nombreCliente = document.getElementById('clienteNombre')?.value.trim();
    if (!nombreCliente) {
      this.showNotification('Por favor escribe tu nombre', 'error');
      return;
    }

    // Crear copia del carrito actual antes de limpiarlo
    const currentCart = [...this.cart];
    const total = this.getTotal();

    let mensaje = `Hola, soy *${nombreCliente}* y quiero hacer el siguiente pedido:\n\n`;
    currentCart.forEach(item => {
      mensaje += `- ${item.cantidad} x ${item.nombre} (Q${item.precio.toFixed(2)} c/u)\n`;
    });
    mensaje += `\n*Total:* Q${total.toFixed(2)}\n\nGracias.`;

    // Abrir WhatsApp
    const urlWhatsapp = `https://wa.me/50242285137?text=${encodeURIComponent(mensaje)}`;
    const whatsappWindow = window.open(urlWhatsapp, '_blank');
    
    // Limpiar el carrito solo si se abrió WhatsApp correctamente
    if (whatsappWindow) {
      setTimeout(() => {
        this.clearCart();
        this.closeCartModal();
      }, 1000);
    }
  }
}

// INICIALIZACIÓN
const carrito = new Carrito();

// Funciones globales
window.addToCart = (product) => carrito.addItem(product);
window.openCart = () => carrito.openCartModal();
window.closeCart = () => carrito.closeCartModal();
window.finalizarPedido = () => carrito.finalizeOrder();
window.vaciarCarrito = () => {
  if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
    carrito.clearCart();
  }
};
window.addEventListener('storage', (event) => {
  if (event.key === CARRITO_KEY) {
    carrito.cart = carrito.loadCart();
    carrito.updateCartCount();
    
    // Si el modal del carrito está abierto, actualizarlo
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && !cartModal.classList.contains('hidden')) {
      carrito.renderCartItems();
    }
  }
});

// Disparar evento personalizado cuando se modifica el carrito
const originalSaveCart = carrito.saveCart;
carrito.saveCart = function() {
  originalSaveCart.call(this);
  // Disparar evento para actualizar en la misma pestaña
  window.dispatchEvent(new CustomEvent('localCartUpdated'));
};

// Inicializar contador
document.addEventListener('DOMContentLoaded', () => {
  carrito.updateCartCount();
});

// Escuchar evento personalizado en la misma pestaña
window.addEventListener('localCartUpdated', () => {
  carrito.cart = carrito.loadCart();
  carrito.updateCartCount();
  
  const cartModal = document.getElementById('cart-modal');
  if (cartModal && !cartModal.classList.contains('hidden')) {
    carrito.renderCartItems();
  }
});

// Modificar el método saveCart para mejor control
carrito.saveCart = function() {
  try {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(this.cart));
    this.updateCartCount();
    window.dispatchEvent(new CustomEvent('localCartUpdated'));
  } catch (error) {
    console.error('Error al guardar el carrito:', error);
    this.showNotification('Error al guardar el carrito', 'error');
  }
};