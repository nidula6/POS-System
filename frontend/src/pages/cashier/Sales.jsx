import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { toast } from 'react-hot-toast';
import { PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProducts(data);
      setIsLoading(false);
    } catch (error) {
      toast.error('Error fetching products');
      setIsLoading(false);
    }
  };

  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      toast.error('Product out of stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        if (existingItem.quantity >= product.stockQuantity) {
          toast.error('Not enough stock available');
          return prevCart;
        }
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p._id === productId);
    if (newQuantity > product.stockQuantity) {
      toast.error('Not enough stock available');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTax = () => {
    return getTotal() * 0.08; // 8% tax
  };

  const getGrandTotal = () => {
    return getTotal() + getTax();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          priceAtSale: item.product.price,
          subtotal: item.product.price * item.quantity
        })),
        subtotal: getTotal(),
        tax: getTax(),
        total: getGrandTotal(),
        paymentMethod: 'cash' // Default to cash, can be made configurable
      };

      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(saleData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process sale');
      }

      toast.success('Sale completed successfully!');

      // Print receipt
      printReceipt(result.sale);

      // Clear cart and refresh products
      setCart([]);
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const printReceipt = (sale) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; max-width: 300px; margin: 0 auto; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            hr { border: none; border-top: 1px dashed #000; }
          </style>
        </head>
        <body>
          <div class="center bold">POS SYSTEM RECEIPT</div>
          <div class="center">Sale #${sale.saleNumber}</div>
          <div class="center">${new Date(sale.createdAt).toLocaleString()}</div>
          <hr>
          ${sale.items.map(item => `
            <div>
              <div>${item.product.name}</div>
              <div class="right">${item.quantity} x $${item.priceAtSale.toFixed(2)} = $${item.subtotal.toFixed(2)}</div>
            </div>
          `).join('')}
          <hr>
          <div class="right">Subtotal: $${sale.subtotal.toFixed(2)}</div>
          <div class="right">Tax: $${sale.tax.toFixed(2)}</div>
          <div class="right bold">Total: $${sale.total.toFixed(2)}</div>
          <div class="center">Thank you for your business!</div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading products...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Products</h2>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.sku}</p>
                  <p className="text-lg font-bold text-indigo-600 mt-2">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Stock: {product.stockQuantity}</p>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stockQuantity <= 0}
                    className="mt-2 w-full bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <ShoppingCartIcon className="h-6 w-6 mr-2" />
              Cart ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <p className="text-gray-500">No items in cart</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.product._id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%):</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
                >
                  Complete Sale
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sales;