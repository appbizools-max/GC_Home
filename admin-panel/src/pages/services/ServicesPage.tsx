import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DollarSign,
  Image as ImageIcon,
  Percent,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ImageUpload } from '../../components/common/ImageUpload';
import { deleteAssetFile, getPublicAssetUrl } from '../../services/storageService';

type TabType = 'services' | 'categories' | 'addons' | 'banners';

interface ServicesPageProps {
  initialTab?: TabType;
  initialBannerSubTab?: 'banners' | 'offers';
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  initialTab,
  initialBannerSubTab,
}) => {
  const navigate = useNavigate();
  const {
    currentTab,
    services,
    serviceCategories,
    serviceAddons,
    homepageBanners = [],
    offers = [],
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
    addHomepageBanner,
    updateHomepageBanner,
    deleteHomepageBanner,
    toggleHomepageBannerActive,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferActive,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'services');
  const [bannerSubTab, setBannerSubTab] = useState<'banners' | 'offers'>(initialBannerSubTab || 'banners');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (currentTab === 'service-categories' || currentTab === 'categories') {
      setActiveTab('categories');
    } else if (currentTab === 'service-addons' || currentTab === 'addons') {
      setActiveTab('addons');
    } else if (currentTab === 'banners' || currentTab === 'offers') {
      setActiveTab('banners');
    } else if (currentTab === 'services' || currentTab === 'services-catalog') {
      setActiveTab('services');
    }
  }, [initialTab, currentTab]);

  useEffect(() => {
    if (initialBannerSubTab) {
      setBannerSubTab(initialBannerSubTab);
    }
  }, [initialBannerSubTab]);

  // Service Modal States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceStartingPrice, setServiceStartingPrice] = useState(699);
  const [servicePricePerRoom, setServicePricePerRoom] = useState<number | undefined>(undefined);
  const [serviceEstimatedDuration, setServiceEstimatedDuration] = useState('2 hours');
  const [serviceImageUrl, setServiceImageUrl] = useState('');
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
  const [categoryImageUrl, setCategoryImageUrl] = useState('');

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

  // Banner Modal States (IMAGE ONLY)
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerIsActive, setBannerIsActive] = useState(true);

  // Offer Modal States
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerDiscountType, setOfferDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [offerDiscountValue, setOfferDiscountValue] = useState<number>(20);
  const [offerMinBookingAmount, setOfferMinBookingAmount] = useState<number>(499);
  const [offerMaxDiscount, setOfferMaxDiscount] = useState<number | undefined>(150);
  const [offerValidFrom, setOfferValidFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [offerValidUntil, setOfferValidUntil] = useState<string>('2027-12-31');
  const [offerImageUrl, setOfferImageUrl] = useState('');
  const [offerTotalUsageLimit, setOfferTotalUsageLimit] = useState<number | undefined>(undefined);
  const [offerUsageLimitPerUser, setOfferUsageLimitPerUser] = useState<number>(1);
  const [offerIsActive, setOfferIsActive] = useState(true);

  // Reset Service Form
  const resetServiceForm = () => {
    setEditingService(null);
    setServiceName('');
    setServiceCategory('');
    setServiceCategoryId('');
    setServiceDescription('');
    setServiceStartingPrice(699);
    setServicePricePerRoom(undefined);
    setServiceEstimatedDuration('2 hours');
    setServiceImageUrl('');
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
    setServiceCategoryId(service.categoryId || '');
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
      categoryId: serviceCategoryId,
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

    let success = false;
    if (editingService) {
      success = await updateService(editingService.serviceId, serviceData);
      if (success && editingService.imageUrl && editingService.imageUrl !== serviceImageUrl) {
        deleteAssetFile(editingService.imageUrl).catch(() => {});
      }
    } else {
      success = await addService(serviceData);
    }

    if (success) {
      setShowServiceModal(false);
      resetServiceForm();
    }
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
    setCategoryImageUrl('');
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
    setCategoryImageUrl(category.image_url || '');
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
      image_url: categoryImageUrl || null,
      is_active: true,
    };

    let success = false;
    if (editingCategory) {
      success = await updateServiceCategory(editingCategory.id, categoryData);
      if (success && editingCategory.image_url && editingCategory.image_url !== categoryImageUrl) {
        deleteAssetFile(editingCategory.image_url).catch(() => {});
      }
    } else {
      success = await addServiceCategory(categoryData);
    }

    if (success) {
      setShowCategoryModal(false);
      resetCategoryForm();
    }
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
      service_id: addonServiceId || null,
      name: addonName,
      description: addonDescription,
      price: Number(addonPrice),
      duration_min: Number(addonDuration),
      image_url: addonImageUrl,
      is_active: true,
      display_order: addonDisplayOrder,
    };

    let success = false;
    if (editingAddon) {
      success = await updateServiceAddon(editingAddon.id, addonData);
      if (success && editingAddon.image_url && editingAddon.image_url !== addonImageUrl) {
        deleteAssetFile(editingAddon.image_url).catch(() => {});
      }
    } else {
      success = await addServiceAddon(addonData);
    }

    if (success) {
      setShowAddonModal(false);
      resetAddonForm();
    }
  };

  // Reset Banner Form (IMAGE ONLY)
  const resetBannerForm = () => {
    setEditingBanner(null);
    setBannerImageUrl('');
    setBannerIsActive(true);
  };

  // Open Edit Banner
  const openEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setBannerImageUrl(banner.image_url || '');
    setBannerIsActive(banner.is_active !== undefined ? banner.is_active : true);
    setShowBannerModal(true);
  };

  // Handle Banner Submit (IMAGE ONLY)
  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl) {
      alert('Please upload a banner image from your local computer.');
      return;
    }

    let success = false;
    if (editingBanner) {
      success = await updateHomepageBanner(editingBanner.id, {
        image_url: bannerImageUrl,
        is_active: bannerIsActive,
      });
      if (success && editingBanner.image_url && editingBanner.image_url !== bannerImageUrl) {
        deleteAssetFile(editingBanner.image_url).catch(() => {});
      }
    } else {
      success = await addHomepageBanner({
        image_url: bannerImageUrl,
        is_active: true,
      });
    }

    if (success) {
      setShowBannerModal(false);
      resetBannerForm();
    }
  };

  // Reset Offer Form
  const resetOfferForm = () => {
    setEditingOffer(null);
    setOfferTitle('');
    setOfferCode('');
    setOfferDescription('');
    setOfferDiscountType('percentage');
    setOfferDiscountValue(20);
    setOfferMinBookingAmount(499);
    setOfferMaxDiscount(150);
    setOfferValidFrom(new Date().toISOString().split('T')[0]);
    setOfferValidUntil('2027-12-31');
    setOfferImageUrl('');
    setOfferTotalUsageLimit(undefined);
    setOfferUsageLimitPerUser(1);
    setOfferIsActive(true);
  };

  // Open Edit Offer
  const openEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setOfferTitle(offer.title || offer.name || '');
    setOfferCode(offer.code || '');
    setOfferDescription(offer.description || '');
    setOfferDiscountType(offer.discount_type || 'percentage');
    setOfferDiscountValue(offer.discount_value || 0);
    setOfferMinBookingAmount(offer.min_booking_amount || 0);
    setOfferMaxDiscount(offer.max_discount || undefined);
    setOfferValidFrom(offer.valid_from ? offer.valid_from.split('T')[0] : new Date().toISOString().split('T')[0]);
    setOfferValidUntil(offer.valid_until ? offer.valid_until.split('T')[0] : '2027-12-31');
    setOfferImageUrl(offer.image_url || (offer.badge_color && offer.badge_color.startsWith('offers/') ? offer.badge_color : ''));
    setOfferTotalUsageLimit(offer.total_usage_limit || undefined);
    setOfferUsageLimitPerUser(offer.usage_limit_per_user || 1);
    setOfferIsActive(offer.is_active !== undefined ? offer.is_active : true);
    setShowOfferModal(true);
  };

  // Handle Offer Submit
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCode.trim()) {
      alert('Offer code is required.');
      return;
    }
    if (!offerTitle.trim()) {
      alert('Offer title is required.');
      return;
    }

    const offerData = {
      title: offerTitle.trim(),
      name: offerTitle.trim(),
      code: offerCode.trim().toUpperCase(),
      description: offerDescription.trim(),
      discount_type: offerDiscountType,
      discount_value: Number(offerDiscountValue),
      min_booking_amount: Number(offerMinBookingAmount || 0),
      max_discount: offerMaxDiscount ? Number(offerMaxDiscount) : null,
      valid_from: new Date(offerValidFrom).toISOString(),
      valid_until: new Date(offerValidUntil + 'T23:59:59Z').toISOString(),
      image_url: offerImageUrl || null,
      imageUrl: offerImageUrl || null,
      total_usage_limit: offerTotalUsageLimit ? Number(offerTotalUsageLimit) : null,
      usage_limit_per_user: Number(offerUsageLimitPerUser || 1),
      is_active: offerIsActive,
    };

    let success = false;
    if (editingOffer) {
      success = await updateOffer(editingOffer.id, offerData);
      if (success && editingOffer.image_url && editingOffer.image_url !== offerImageUrl) {
        deleteAssetFile(editingOffer.image_url).catch(() => {});
      }
    } else {
      success = await addOffer(offerData);
    }

    if (success) {
      setShowOfferModal(false);
      resetOfferForm();
    }
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
          onClick={() => {
            setActiveTab('services');
            navigate('/admin/services');
          }}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'services'
              ? 'text-[#123D2A] border-b-2 border-[#123D2A]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span>Services ({services.length})</span>
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('categories');
            navigate('/admin/categories');
          }}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'categories'
              ? 'text-[#123D2A] border-b-2 border-[#123D2A]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            <span>Categories ({serviceCategories.length})</span>
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('addons');
            navigate('/admin/addons');
          }}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'addons'
              ? 'text-[#123D2A] border-b-2 border-[#123D2A]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Add-ons ({serviceAddons.length})</span>
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('banners');
            navigate('/admin/offers');
          }}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'banners'
              ? 'text-[#123D2A] border-b-2 border-[#123D2A]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>Banners & Offers ({homepageBanners.length + offers.length})</span>
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
              className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
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
                className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
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
                              src={getPublicAssetUrl(service.imageUrl)}
                              alt={service.name}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                              }}
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
                          <span className="text-base font-black text-[#123D2A]">
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
                                  deleteService(service.serviceId).then((success) => {
                                    if (success && service.imageUrl) {
                                      deleteAssetFile(service.imageUrl).catch(() => {});
                                    }
                                  });
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
              className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
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
                className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
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
                    <div className="flex items-center gap-3">
                      {category.image_url ? (
                        <img
                          src={getPublicAssetUrl(category.image_url)}
                          alt={category.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: category.bg_color,
                          color: category.icon_color,
                        }}
                      >
                        <Grid className="w-6 h-6" />
                      </div>
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
                    <button
                      type="button"
                      onClick={() => updateServiceCategory(category.id, { is_active: !category.is_active })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        category.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {category.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
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
              className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
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
                className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
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
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      {addon.image_url ? (
                        <img
                          src={getPublicAssetUrl(addon.image_url)}
                          alt={addon.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="flex-1">
                        <h3 className="text-sm font-black text-slate-900">{addon.name}</h3>
                        {addon.description && (
                          <p className="text-xs text-slate-500 mt-1">{addon.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditAddon(addon)}
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${addon.name}"? This action cannot be undone.`)) {
                            deleteServiceAddon(addon.id).then((ok) => {
                              if (ok && addon.image_url) {
                                deleteAssetFile(addon.image_url).catch(() => {});
                              }
                            });
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
                    <button
                      type="button"
                      onClick={() => updateServiceAddon(addon.id, { is_active: !addon.is_active })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        addon.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {addon.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
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
                    value={serviceCategoryId || serviceCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedCat = serviceCategories.find(c => c.id === val || c.name === val);
                      if (matchedCat) {
                        setServiceCategoryId(matchedCat.id);
                        setServiceCategory(matchedCat.name);
                      } else {
                        setServiceCategory(val);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a category</option>
                    {serviceCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
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
                  <ImageUpload
                    value={serviceImageUrl}
                    onChange={(url) => setServiceImageUrl(url)}
                    folder="services"
                    label="Service Cover Image (Local Upload)"
                    required
                    helperText="Upload JPG, PNG or WEBP from local computer (Max 5MB)"
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
                    <span className="text-xs font-bold text-slate-700">Mark as Top Rated / Bestseller (Customer Home)</span>
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
                  className="flex-1 px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
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

                <div>
                  <ImageUpload
                    value={categoryImageUrl}
                    onChange={(url) => setCategoryImageUrl(url)}
                    folder="categories"
                    label="Category Image / Banner (Optional)"
                    helperText="Upload JPG, PNG or WEBP from local computer (Max 5MB)"
                  />
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
                  className="flex-1 px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
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

                <div>
                  <ImageUpload
                    value={addonImageUrl}
                    onChange={(url) => setAddonImageUrl(url)}
                    folder="addons"
                    label="Add-on Image (Optional)"
                    helperText="Upload JPG, PNG or WEBP from local computer (Max 5MB)"
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
                  className="flex-1 px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAddon ? 'Update Add-on' : 'Create Add-on'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banners & Offers Tab */}
      {activeTab === 'banners' && (
        <div className="flex flex-col gap-6">
          {/* Sub-Tabs Switcher: Banners vs Offers */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setBannerSubTab('banners')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  bannerSubTab === 'banners'
                    ? 'bg-white text-[#123D2A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Homepage Banners ({homepageBanners.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setBannerSubTab('offers')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  bannerSubTab === 'offers'
                    ? 'bg-white text-[#123D2A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>Promotional Offers ({offers.length})</span>
              </button>
            </div>

            {bannerSubTab === 'banners' ? (
              <button
                type="button"
                onClick={() => {
                  resetBannerForm();
                  setShowBannerModal(true);
                }}
                className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Homepage Banner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  resetOfferForm();
                  setShowOfferModal(true);
                }}
                className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Offer</span>
              </button>
            )}
          </div>

          {/* Sub-Tab 1: Banners Content */}
          {bannerSubTab === 'banners' && (
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Image-Only Homepage Carousel:</span> Clicking any banner in the customer app directly opens the <strong>Services Listing Screen</strong>.
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  Recommended: 1200 × 520 (WebP / PNG)
                </span>
              </div>

              {homepageBanners.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No homepage banners found</p>
                  <p className="text-xs text-slate-400 mt-1">Upload a hero banner to feature services on customer app</p>
                  <button
                    onClick={() => {
                      resetBannerForm();
                      setShowBannerModal(true);
                    }}
                    className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Homepage Banner</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {homepageBanners.map((banner) => (
                    <div
                      key={banner.id}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="relative aspect-[21/9] w-full bg-slate-100 overflow-hidden">
                        <img
                          src={getPublicAssetUrl(banner.image_url)}
                          alt="Homepage Banner"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                          }}
                        />
                        <span
                          className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                            banner.is_active
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="p-3.5 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => toggleHomepageBannerActive ? toggleHomepageBannerActive(banner.id) : updateHomepageBanner(banner.id, { is_active: !banner.is_active })}
                          className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            banner.is_active ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {banner.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                          <span>{banner.is_active ? 'Active' : 'Inactive'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBanner(banner)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-sky-700 rounded-lg transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                            title="Replace Banner Image"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this homepage banner?')) {
                                deleteHomepageBanner(banner.id).then((ok) => {
                                  if (ok && banner.image_url) {
                                    deleteAssetFile(banner.image_url).catch(() => {});
                                  }
                                });
                              }
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-rose-700 rounded-lg transition-all cursor-pointer"
                            title="Delete Banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 2: Offers Content */}
          {bannerSubTab === 'offers' && (
            <div className="flex flex-col gap-4">
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Promotional Discount Engine:</span> Offers are applied during checkout with minimum order validation, discount caps, and date validity.
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md">
                  Active Coupons: {offers.filter(o => o.is_active).length}
                </span>
              </div>

              {offers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Percent className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No promotional offers found</p>
                  <p className="text-xs text-slate-400 mt-1">Create coupons and discounts to boost bookings</p>
                  <button
                    onClick={() => {
                      resetOfferForm();
                      setShowOfferModal(true);
                    }}
                    className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Offer</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Offer Header with Image / Banner */}
                        <div className="relative h-28 w-full bg-gradient-to-r from-[#123D2A] to-[#0A192F] overflow-hidden">
                          {(offer.image_url || (offer.badge_color && offer.badge_color.startsWith('offers/'))) ? (
                            <img
                              src={getPublicAssetUrl(offer.image_url || offer.badge_color)}
                              alt={offer.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <Sparkles className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                            <span className="font-mono text-sm font-black bg-white/95 text-[#123D2A] px-2.5 py-1 rounded-lg tracking-wider shadow-sm">
                              {offer.code}
                            </span>
                            <span className="text-xs font-black text-amber-300 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                              {offer.discount_type === 'percentage'
                                ? `${offer.discount_value}% OFF`
                                : `₹${offer.discount_value} OFF`}
                            </span>
                          </div>
                        </div>

                        {/* Offer Details */}
                        <div className="p-4 flex flex-col gap-2">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 line-clamp-1">{offer.title}</h3>
                            {offer.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{offer.description}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Min Booking:</span>
                              <span className="font-bold text-slate-800">₹{offer.min_booking_amount || 0}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Max Discount:</span>
                              <span className="font-bold text-slate-800">
                                {offer.max_discount ? `₹${offer.max_discount}` : 'No limit'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Valid Until:</span>
                              <span className="font-bold text-slate-800">
                                {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'Unlimited'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Per User Limit:</span>
                              <span className="font-bold text-slate-800">{offer.usage_limit_per_user || 1} time(s)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Offer Actions */}
                      <div className="p-3.5 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => toggleOfferActive ? toggleOfferActive(offer.id) : updateOffer(offer.id, { is_active: !offer.is_active })}
                          className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            offer.is_active ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {offer.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                          <span>{offer.is_active ? 'Active' : 'Disabled'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditOffer(offer)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-sky-700 rounded-lg transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                            title="Edit Offer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete offer "${offer.code}"?`)) {
                                deleteOffer(offer.id).then((ok) => {
                                  if (ok && offer.image_url) {
                                    deleteAssetFile(offer.image_url).catch(() => {});
                                  }
                                });
                              }
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-rose-700 rounded-lg transition-all cursor-pointer"
                            title="Delete Offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Banner Modal - IMAGE ONLY */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleBannerSubmit} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {editingBanner ? 'Replace Banner Image' : 'Add Homepage Banner'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload a hero banner to feature on the Customer App homepage
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerModal(false);
                    resetBannerForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <ImageUpload
                  value={bannerImageUrl}
                  onChange={(url) => setBannerImageUrl(url)}
                  folder="banners"
                  label="Banner Image (Local Upload) *"
                  required
                  aspectRatio="banner"
                  helperText="Supported: JPG, PNG, WEBP. Maximum 5 MB."
                />

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>💡</span> Banner Behavior
                  </p>
                  <p className="mt-1 text-emerald-700 leading-relaxed">
                    When customers tap this banner on the homepage carousel, they will be navigated directly to the <strong>Services Listing Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerModal(false);
                    resetBannerForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingBanner ? 'Update Banner' : 'Upload Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Modal - PROMOTIONS & COUPONS */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleOfferSubmit} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {editingOffer ? 'Edit Promotional Offer' : 'Add New Promotional Offer'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure discounts and promotional coupons for customer checkout
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferModal(false);
                    resetOfferForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
                <ImageUpload
                  value={offerImageUrl}
                  onChange={(url) => setOfferImageUrl(url)}
                  folder="offers"
                  label="Offer Promo Image (Local Upload)"
                  helperText="Upload JPG, PNG or WEBP from local computer (Max 5MB)"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Offer Title *</label>
                    <input
                      type="text"
                      value={offerTitle}
                      onChange={(e) => setOfferTitle(e.target.value)}
                      placeholder="e.g., 20% Off Home Deep Clean"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Coupon Code *</label>
                    <input
                      type="text"
                      value={offerCode}
                      onChange={(e) => setOfferCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="e.g., CLEAN20"
                      required
                      className="w-full px-3 py-2 font-mono uppercase tracking-wider font-black border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    placeholder="Short description of the offer terms..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount Type *</label>
                    <select
                      value={offerDiscountType}
                      onChange={(e) => setOfferDiscountType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Discount Value * ({offerDiscountType === 'percentage' ? '%' : '₹'})
                    </label>
                    <input
                      type="number"
                      value={offerDiscountValue}
                      onChange={(e) => setOfferDiscountValue(Number(e.target.value))}
                      min="1"
                      max={offerDiscountType === 'percentage' ? 100 : undefined}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      value={offerMinBookingAmount}
                      onChange={(e) => setOfferMinBookingAmount(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      value={offerMaxDiscount || ''}
                      onChange={(e) => setOfferMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g., 200 (optional)"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Valid From</label>
                    <input
                      type="date"
                      value={offerValidFrom}
                      onChange={(e) => setOfferValidFrom(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Valid Until</label>
                    <input
                      type="date"
                      value={offerValidUntil}
                      onChange={(e) => setOfferValidUntil(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Usage Limit</label>
                    <input
                      type="number"
                      value={offerTotalUsageLimit || ''}
                      onChange={(e) => setOfferTotalUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Unlimited"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Per User Limit</label>
                    <input
                      type="number"
                      value={offerUsageLimitPerUser}
                      onChange={(e) => setOfferUsageLimitPerUser(Number(e.target.value))}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="offerIsActive"
                    checked={offerIsActive}
                    onChange={(e) => setOfferIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="offerIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Offer is Active & Available for Customers
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferModal(false);
                    resetOfferForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingOffer ? 'Update Offer' : 'Save Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

