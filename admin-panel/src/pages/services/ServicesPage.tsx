import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Edit2, 
  Star,
  Package,
  Grid,
  List,
  X,
  Save,
  Tag,
  Clock,
  DollarSign
} from 'lucide-react';

type TabType = 'services' | 'categories' | 'addons';

export const ServicesPage: React.FC = () => {
  const {
    services,
    serviceCategories,
    serviceAddons,
    toggleServiceActive,
    addService,
    updateService,
    deleteService,
    addServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    addServiceAddon,
    updateServiceAddon,
    deleteServiceAddon,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabType>('services');

  // Service Modal States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceStartingPrice, setServiceStartingPrice] = useState(699);
  const [servicePricePerRoom, setServicePricePerRoom] = useState<number | undefined>(undefined);
  const [serviceEstimatedDuration, setServiceEstimatedDuration] = useState('2 hours');
  const [serviceImageUrl, setServiceImageUrl] = useState('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600');
  const [serviceFeatures, setServiceFeatures] = useState<string[]>(['Sweeping & Mopping', 'Surface dusting', 'Trash disposal']);
  const [newFeature, setNewFeature] = useState('');
  const [serviceIsBestseller, setServiceIsBestseller] = useState(false);
  const [serviceDisplayOrder, setServiceDisplayOrder] = useState(0);

  // Category Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIconName, setCategoryIconName] = useState('home');
  const [categoryBgColor, setCategoryBgColor] = useState('#EAF8F1');
  const [categoryIconColor, setCategoryIconColor] = useState('#168A68');
  const [categoryRouteCategory, setCategoryRouteCategory] = useState('home_cleaning');
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState(0);

  // Addon Modal States
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any>(null);
  const [addonServiceId, setAddonServiceId] = useState('');
  const [addonName, setAddonName] = useState('');
  const [addonDescription, setAddonDescription] = useState('');
  const [addonPrice, setAddonPrice] = useState(0);
  const [addonDuration, setAddonDuration] = useState(30);
  const [addonImageUrl, setAddonImageUrl] = useState('');
  const [addonDisplayOrder, setAddonDisplayOrder] = useState(0);

  // Reset Service Form
  const resetServiceForm = () => {
    setEditingService(null);
    setServiceName('');
    setServiceCategory('');
    setServiceDescription('');
    setServiceStartingPrice(699);
    setServicePricePerRoom(undefined);
    setServiceEstimatedDuration('2 hours');
    setServiceImageUrl('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600');
    setServiceFeatures(['Sweeping & Mopping', 'Surface dusting', 'Trash disposal']);
    setNewFeature('');
    setServiceIsBestseller(false);
    setServiceDisplayOrder(0);
  };

  // Open Edit Service
  const openEditService = (service: any) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceCategory(service.category);
    setServiceDescription(service.description);
    setServiceStartingPrice(service.startingPrice);
    setServicePricePerRoom(service.pricePerRoom);
    setServiceEstimatedDuration(service.estimatedDuration);
    setServiceImageUrl(service.imageUrl);
    setServiceFeatures(service.features || []);
    setServiceIsBestseller(service.isBestseller || false);
    setServiceDisplayOrder(service.displayOrder || 0);
    setShowServiceModal(true);
  };

  // Handle Service Submit
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData = {
      name: serviceName,
      category: serviceCategory,
      description: serviceDescription,
      startingPrice: Number(serviceStartingPrice),
      pricePerRoom: servicePricePerRoom ? Number(servicePricePerRoom) : undefined,
      estimatedDuration: serviceEstimatedDuration,
      imageUrl: serviceImageUrl,
      isActive: true,
      features: serviceFeatures,
      isBestseller: serviceIsBestseller,
      displayOrder: serviceDisplayOrder,
    };

    if (editingService) {
      await updateService(editingService.serviceId, serviceData);
    } else {
      await addService(serviceData);
    }

    setShowServiceModal(false);
    resetServiceForm();
  };

  // Reset Category Form
  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIconName('home');
    setCategoryBgColor('#EAF8F1');
    setCategoryIconColor('#168A68');
    setCategoryRouteCategory('home_cleaning');
    setCategoryDisplayOrder(0);
  };

  // Open Edit Category
  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryIconName(category.icon_name);
    setCategoryBgColor(category.bg_color);
    setCategoryIconColor(category.icon_color);
    setCategoryRouteCategory(category.route_category);
    setCategoryDisplayOrder(category.display_order);
    setShowCategoryModal(true);
  };

  // Handle Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryData = {
      name: categoryName,
      icon_name: categoryIconName,
      bg_color: categoryBgColor,
      icon_color: categoryIconColor,
      route_category: categoryRouteCategory,
      display_order: categoryDisplayOrder,
      is_active: true,
    };

    if (editingCategory) {
      await updateServiceCategory(editingCategory.id, categoryData);
    } else {
      await addServiceCategory(categoryData);
    }

    setShowCategoryModal(false);
    resetCategoryForm();
  };

  // Reset Addon Form
  const resetAddonForm = () => {
    setEditingAddon(null);
    setAddonServiceId('');
    setAddonName('');
    setAddonDescription('');
    setAddonPrice(0);
    setAddonDuration(30);
    setAddonImageUrl('');
    setAddonDisplayOrder(0);
  };

  // Open Edit Addon
  const openEditAddon = (addon: any) => {
    setEditingAddon(addon);
    setAddonServiceId(addon.service_id);
    setAddonName(addon.name);
    setAddonDescription(addon.description || '');
    setAddonPrice(addon.price);
    setAddonDuration(addon.duration_min);
    setAddonImageUrl(addon.image_url || '');
    setAddonDisplayOrder(addon.display_order);
    setShowAddonModal(true);
  };

  // Handle Addon Submit
  const handleAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const addonData = {
      service_id: addonServiceId,
      name: addonName,
      description: addonDescription,
      price: Number(addonPrice),
      duration_min: Number(addonDuration),
      image_url: addonImageUrl,
      is_active: true,
      display_order: addonDisplayOrder,
    };

    if (editingAddon) {
      await updateServiceAddon(editingAddon.id, addonData);
    } else {
      await addServiceAddon(addonData);
    }

    setShowAddonModal(false);
    resetAddonForm();
  };

  // Add Feature
  const addFeature = () => {
    if (newFeature.trim()) {
      setServiceFeatures([...serviceFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  // Remove Feature
  const removeFeature = (index: number) => {
    setServiceFeatures(serviceFeatures.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Service Catalog Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage services, categories, and add-ons for the customer app
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'services'
              ? 'text-[#043927] border-b-2 border-[#043927]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span>Services ({services.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'categories'
              ? 'text-[#043927] border-b-2 border-[#043927]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            <span>Categories ({serviceCategories.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('addons')}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'addons'
              ? 'text-[#043927] border-b-2 border-[#043927]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Add-ons ({serviceAddons.length})</span>
          </div>
        </button>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Manage cleaning services visible in the customer app
            </p>
            <button
              onClick={() => {
                resetServiceForm();
                setShowServiceModal(true);
              }}
              className="bg-[#043927] hover:bg-[#064e3b] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          </div>

          {services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <List className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-400">No services found</p>
              <p className="text-xs text-slate-400 mt-1">Create your first service to get started</p>
              <button
                onClick={() => {
                  resetServiceForm();
                  setShowServiceModal(true);
                }}
                className="mt-4 bg-[#043927] hover:bg-[#064e3b] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200/80 text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Starting Price</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {services.map((service) => (
                      <tr key={service.serviceId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={service.imageUrl}
                              alt={service.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                {service.name}
                                {service.isBestseller && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {service.description?.substring(0, 50)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                            {service.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{service.estimatedDuration}</td>
                        <td className="py-3 px-4">
                          <span className="text-base font-black text-[#043927]">
                            ₹{service.startingPrice}
                          </span>
                          {service.pricePerRoom && (
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              +₹{service.pricePerRoom}/room
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-bold">{service.rating || 0}</span>
                            <span className="text-slate-400">({service.reviewCount || 0})</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleServiceActive(service.serviceId)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              service.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {service.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                            {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditService(service)}
                              className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-all cursor-pointer"
                              title="Edit Service"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${service.name}"? This action cannot be undone.`)) {
                                  deleteService(service.serviceId);
                                }
                              }}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all cursor-pointer"
                              title="Delete Service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Manage service categories for organization and filtering
            </p>
            <button
              onClick={() => {
                resetCategoryForm();
                setShowCategoryModal(true);
              }}
              className="bg-[#043927] hover:bg-[#064e3b] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          {serviceCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Grid className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-400">No categories found</p>
              <p className="text-xs text-slate-400 mt-1">Create your first category to organize services</p>
              <button
                onClick={() => {
                  resetCategoryForm();
                  setShowCategoryModal(true);
                }}
                className="mt-4 bg-[#043927] hover:bg-[#064e3b] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: category.bg_color,
                        color: category.icon_color,
                      }}
                    >
                      <Grid className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditCategory(category)}
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${category.name}"? This action cannot be undone.`)) {
                            deleteServiceCategory(category.id);
                          }
                        }}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-1">{category.name}</h3>
                  <p className="text-xs text-slate-500 mb-2">Route: {category.route_category}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Display Order:</span>
                    <span className="text-xs font-bold text-slate-700">{category.display_order}</span>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        category.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {category.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add-ons Tab */}
      {activeTab === 'addons' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Manage optional add-ons that customers can purchase with services
            </p>
            <button
              onClick={() => {
                resetAddonForm();
                setShowAddonModal(true);
              }}
              className="bg-[#043927] hover:bg-[#064e3b] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Add-on</span>
            </button>
          </div>

          {serviceAddons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-400">No add-ons found</p>
              <p className="text-xs text-slate-400 mt-1">Create add-ons to offer additional services</p>
              <button
                onClick={() => {
                  resetAddonForm();
                  setShowAddonModal(true);
                }}
                className="mt-4 bg-[#043927] hover:bg-[#064e3b] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Add-on</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-slate-900">{addon.name}</h3>
                      {addon.description && (
                        <p className="text-xs text-slate-500 mt-1">{addon.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditAddon(addon)}
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${addon.name}"? This action cannot be undone.`)) {
                            deleteServiceAddon(addon.id);
                          }
                        }}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {addon.service?.name && (
                    <div className="mb-3">
                      <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        {addon.service.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-black text-slate-900">₹{addon.price}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium">{addon.duration_min}m</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        addon.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {addon.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-xl">
            <form onSubmit={handleServiceSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    resetServiceForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Service Name</label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g., Deep Home Cleaning (2 BHK)"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a category</option>
                    {serviceCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="Home Cleaning">Home Cleaning</option>
                    <option value="Deep Cleaning">Deep Cleaning</option>
                    <option value="Specialized">Specialized</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Brief description of the service..."
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Starting Price (₹)</label>
                    <input
                      type="number"
                      value={serviceStartingPrice}
                      onChange={(e) => setServiceStartingPrice(Number(e.target.value))}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Price Per Room (₹)</label>
                    <input
                      type="number"
                      value={servicePricePerRoom || ''}
                      onChange={(e) => setServicePricePerRoom(e.target.value ? Number(e.target.value) : undefined)}
                      min="0"
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration</label>
                    <input
                      type="text"
                      value={serviceEstimatedDuration}
                      onChange={(e) => setServiceEstimatedDuration(e.target.value)}
                      placeholder="e.g., 2 hours"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      value={serviceDisplayOrder}
                      onChange={(e) => setServiceDisplayOrder(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Image URL</label>
                  <input
                    type="url"
                    value={serviceImageUrl}
                    onChange={(e) => setServiceImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Features</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {serviceFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2"
                      >
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="hover:bg-emerald-100 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                      placeholder="Add a feature..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs hover:bg-emerald-100 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={serviceIsBestseller}
                      onChange={(e) => setServiceIsBestseller(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Mark as Bestseller</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    resetServiceForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#043927] hover:bg-[#064e3b] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingService ? 'Update Service' : 'Create Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <form onSubmit={handleCategorySubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetCategoryForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g., Deep Cleaning"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Icon Name</label>
                    <input
                      type="text"
                      value={categoryIconName}
                      onChange={(e) => setCategoryIconName(e.target.value)}
                      placeholder="e.g., home"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      value={categoryDisplayOrder}
                      onChange={(e) => setCategoryDisplayOrder(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Route Category</label>
                  <input
                    type="text"
                    value={categoryRouteCategory}
                    onChange={(e) => setCategoryRouteCategory(e.target.value)}
                    placeholder="e.g., deep_cleaning"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Background Color</label>
                    <input
                      type="color"
                      value={categoryBgColor}
                      onChange={(e) => setCategoryBgColor(e.target.value)}
                      className="w-full h-10 border border-slate-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Icon Color</label>
                    <input
                      type="color"
                      value={categoryIconColor}
                      onChange={(e) => setCategoryIconColor(e.target.value)}
                      className="w-full h-10 border border-slate-300 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetCategoryForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#043927] hover:bg-[#064e3b] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Addon Modal */}
      {showAddonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <form onSubmit={handleAddonSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  {editingAddon ? 'Edit Add-on' : 'Add New Add-on'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddonModal(false);
                    resetAddonForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Service</label>
                  <select
                    value={addonServiceId}
                    onChange={(e) => setAddonServiceId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.serviceId} value={service.serviceId}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Add-on Name</label>
                  <input
                    type="text"
                    value={addonName}
                    onChange={(e) => setAddonName(e.target.value)}
                    placeholder="e.g., Fridge Cleaning"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                  <textarea
                    value={addonDescription}
                    onChange={(e) => setAddonDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Price (₹)</label>
                    <input
                      type="number"
                      value={addonPrice}
                      onChange={(e) => setAddonPrice(Number(e.target.value))}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (mins)</label>
                    <input
                      type="number"
                      value={addonDuration}
                      onChange={(e) => setAddonDuration(Number(e.target.value))}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Image URL (Optional)</label>
                    <input
                      type="url"
                      value={addonImageUrl}
                      onChange={(e) => setAddonImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      value={addonDisplayOrder}
                      onChange={(e) => setAddonDisplayOrder(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddonModal(false);
                    resetAddonForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#043927] hover:bg-[#064e3b] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAddon ? 'Update Add-on' : 'Create Add-on'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
