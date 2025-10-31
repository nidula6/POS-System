import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    cost: '',
    stockQuantity: '',
    minStockLevel: '',
    description: '',
    barcode: ''
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate numeric fields
      const numericFields = ['price', 'cost', 'stockQuantity', 'minStockLevel'];
      numericFields.forEach(field => {
        if (isNaN(formData[field]) || formData[field] < 0) {
          throw new Error(`Invalid ${field} value`);
        }
      });

      await onSave(formData);
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
        <div>
          <label className="text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-700">SKU</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            required
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-700">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-700">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-700">Cost</label>
          <input
            type="number"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-700">Stock Quantity</label>
          <input
            type="number"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleChange}
            required
            min="0"
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-700">Minimum Stock Level</label>
          <input
            type="number"
            name="minStockLevel"
            value={formData.minStockLevel}
            onChange={handleChange}
            required
            min="0"
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-700">Barcode</label>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full mt-2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-500"
        >
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;