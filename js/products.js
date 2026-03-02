// ============================================
// PRODUCTS MANAGEMENT
// ============================================

const Products = {
    list: [],
    
    // Load all products
    async load() {
        try {
            const snapshot = await firebaseApp.db
                .collection('products')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return this.list;
        } catch (error) {
            console.error('Error loading products:', error);
            Animations.showToast('خطأ في تحميل المنتجات', 'error');
            return [];
        }
    },
    
    // Render products to container
    render(containerId, productsToRender = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const items = productsToRender || this.list;
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3>لا توجد منتجات</h3>
                    <p>سيتم إضافة منتجات قريباً</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image" loading="lazy">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${product.price} ريال</div>
                    <button class="btn btn-primary btn-block" onclick="Products.buy('${product.id}')">
                        شراء الآن
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Show skeleton loading
    showSkeleton(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = Array(count).fill(`
            <div class="skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `).join('');
    },
    
    // Search products
    search(term) {
        const lowerTerm = term.toLowerCase();
        return this.list.filter(p => 
            p.name.toLowerCase().includes(lowerTerm) || 
            p.description.toLowerCase().includes(lowerTerm)
        );
    },
    
    // Get single product
    get(id) {
        return this.list.find(p => p.id === id);
    },
    
    // Add new product (admin only)
    async add(productData, imageFile, onProgress) {
        try {
            // Upload image
            const imageRef = firebaseApp.storage.ref(`products/${Date.now()}_${imageFile.name}`);
            const uploadTask = imageRef.put(imageFile);
            
            // Track progress
            if (onProgress) {
                uploadTask.on('state_changed', (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                });
            }
            
            await uploadTask;
            const imageUrl = await imageRef.getDownloadURL();
            
            // Save product
            const docRef = await firebaseApp.db.collection('products').add({
                ...productData,
                imageUrl: imageUrl,
                createdAt: firebaseApp.timestamp(),
                createdBy: Auth.getCurrentUser()?.uid
            });
            
            return { success: true, id: docRef.id };
            
        } catch (error) {
            console.error('Error adding product:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Buy product - Open Moyasar payment
    buy(productId) {
        const product = this.get(productId);
        if (!product) return;
        
        // Store current product for callback
        window.currentProduct = product;
        
        // Open payment modal or redirect
        const modal = document.getElementById('paymentModal');
        if (modal) {
            document.getElementById('productDetails').innerHTML = `
                <p style="margin-bottom: 15px; color: #888;">
                    المنتج: <strong style="color: #fff;">${product.name}</strong><br>
                    السعر: <strong style="color: #00d4ff;">${product.price} ريال</strong>
                </p>
            `;
            
            modal.classList.add('show');
            
            // Initialize Moyasar
            if (typeof Moyasar !== 'undefined') {
                Moyasar.init({
                    element: '.mysr-form',
                    amount: product.price * 100,
                    currency: 'SAR',
                    description: `شراء: ${product.name}`,
                    publishable_api_key: 'pk_live_uMadyRRfpzd5PsvGgLBeCHLHbyHs5tH9Z43Ax3g7',
                    callback_url: `${window.location.origin}/home.html?payment=success`,
                    supported_networks: ['visa', 'mastercard', 'mada'],
                    methods: ['creditcard'],
                    on_completed: (payment) => this.handlePaymentSuccess(payment),
                    on_failure: (error) => {
                        Animations.showToast('فشل الدفع، حاول مرة أخرى', 'error');
                        console.error(error);
                    }
                });
            }
        }
    },
    
    // Handle successful payment
    async handlePaymentSuccess(payment) {
        try {
            const product = window.currentProduct;
            const user = Auth.getCurrentUser();
            
            if (!product || !user) return;
            
            // Save order
            await firebaseApp.db.collection('orders').add({
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName,
                productId: product.id,
                productName: product.name,
                productPrice: product.price,
                paymentId: payment.id,
                paymentStatus: payment.status,
                status: 'completed',
                createdAt: firebaseApp.timestamp()
            });
            
            Animations.showToast('تم الدفع بنجاح! 🎉', 'success');
            
            // Close modal
            const modal = document.getElementById('paymentModal');
            if (modal) modal.classList.remove('show');
            
        } catch (error) {
            console.error('Error saving order:', error);
            Animations.showToast('تم الدفع لكن حدث خطأ في حفظ الطلب', 'error');
        }
    }
};

// Export
window.Products = Products;
