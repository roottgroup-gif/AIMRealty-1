import { useState, useEffect, useRef } from "react";

export type Language = "en" | "ar" | "kur";

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
    kur: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.home": {
    en: "Home",
    ar: "الرئيسية",
    kur: "سەرەتا",
  },
  "nav.properties": {
    en: "Properties",
    ar: "العقارات",
    kur: "خانووبەرە",
  },
  "nav.agents": {
    en: "Agents",
    ar: "الوكلاء",
    kur: "بریکار",
  },
  "nav.about": {
    en: "About",
    ar: "حول",
    kur: "دەربارە",
  },
  "nav.signIn": {
    en: "Sign In",
    ar: "تسجيل الدخول",
    kur: "چوونەژوورەوە",
  },

  // Hero Section
  "hero.title": {
    en: "Find Your Perfect Home with AI",
    ar: "اعثر على منزلك المثالي بالذكاء الاصطناعي",
    kur: "ماڵی تەواوی خۆت بە AI بدۆزەرەوە",
  },
  "hero.subtitle": {
    en: "Discover properties tailored to your needs using intelligent recommendations",
    ar: "اكتشف العقارات المصممة خصيصًا لاحتياجاتك باستخدام التوصيات الذكية",
    kur: "خانووبەرەکان بدۆزەرەوە کە بە پێی پێداویستییەکانت داڕێژراون",
  },
  "hero.searchPlaceholder": {
    en: "Ask AI: 'Find me a 3-bedroom house under $200k near downtown'",
    ar: "اسأل الذكاء الاصطناعي: 'ابحث لي عن منزل بـ 3 غرف نوم تحت 200 ألف دولار بالقرب من وسط المدينة'",
    kur: "لە AI بپرسە: 'ماڵێکی 3 ژووری نوستن بدۆزەرەوە کە کەمتر لە 200 هەزار دۆلار بێت'",
  },
  "hero.search": {
    en: "Search",
    ar: "بحث",
    kur: "گەڕان",
  },

  // Quick Filters
  "filter.forSale": {
    en: "For Sale",
    ar: "للبيع",
    kur: "بۆ فرۆشتن",
  },
  "filter.forRent": {
    en: "For Rent",
    ar: "للإيجار",
    kur: "بۆ کرێ",
  },
  "filter.houses": {
    en: "Houses",
    ar: "منازل",
    kur: "ماڵەکان",
  },
  "filter.apartments": {
    en: "Apartments",
    ar: "شقق",
    kur: "شوقەکان",
  },
  "filter.nearMe": {
    en: "Near Me",
    ar: "بالقرب مني",
    kur: "نزیکی من",
  },

  // Property Details
  "property.beds": {
    en: "Beds",
    ar: "غرف نوم",
    kur: "ژووری نوستن",
  },
  "property.baths": {
    en: "Baths",
    ar: "حمامات",
    kur: "حەمام",
  },
  "property.sqft": {
    en: "sq ft",
    ar: "قدم مربع",
    kur: "پێی چوارگۆشە",
  },
  "property.viewDetails": {
    en: "View Details",
    ar: "عرض التفاصيل",
    kur: "بینینی وردەکارییەکان",
  },
  "property.viewProperty": {
    en: "View Property",
    ar: "عرض العقار",
    kur: "بینینی خانووبەرە",
  },

  // Contact
  "contact.callNow": {
    en: "Call Now",
    ar: "اتصل الآن",
    kur: "ئێستا پەیوەندی بکە",
  },
  "contact.sendMessage": {
    en: "Send Message",
    ar: "إرسال رسالة",
    kur: "نامە بنێرە",
  },
  "contact.name": {
    en: "Your Name",
    ar: "اسمك",
    kur: "ناوت",
  },
  "contact.email": {
    en: "Your Email",
    ar: "بريدك الإلكتروني",
    kur: "ئیمەیڵت",
  },
  "contact.message": {
    en: "Your Message",
    ar: "رسالتك",
    kur: "نامەکەت",
  },
  "contact.contactNumber": {
    en: "Contact Number",
    ar: "رقم الاتصال",
    kur: "ژمارەی پەیوەندی",
  },
  "contact.whatsapp": {
    en: "WhatsApp",
    ar: "واتساب",
    kur: "واتساپ",
  },
  "contact.agentTitle": {
    en: "Licensed Real Estate Agent",
    ar: "وكيل عقارات مرخص",
    kur: "بریکاری خانووبەرەی مۆڵەتدار",
  },

  // Property Status
  "property.status.active": {
    en: "Active",
    ar: "نشط",
    kur: "چالاک",
  },

  // Common
  "common.loading": {
    en: "Loading...",
    ar: "جاري التحميل...",
    kur: "بارکردن...",
  },
  "common.error": {
    en: "An error occurred",
    ar: "حدث خطأ",
    kur: "هەڵەیەک ڕوویدا",
  },
  "common.noResults": {
    en: "No results found",
    ar: "لا توجد نتائج",
    kur: "هیچ ئەنجامێک نەدۆزرایەوە",
  },

  // Property Detail Page
  "property.backToHome": {
    en: "Back to Home",
    ar: "العودة للرئيسية",
    kur: "گەڕانەوە بۆ سەرەتا",
  },
  "property.description": {
    en: "Description",
    ar: "الوصف",
    kur: "وەسف",
  },
  "property.featuresAmenities": {
    en: "Features & Amenities",
    ar: "المزايا والخدمات",
    kur: "تایبەتمەندی و خزمەتگوزاریەکان",
  },
  "property.features": {
    en: "Features",
    ar: "المزايا",
    kur: "تایبەتمەندییەکان",
  },
  "property.amenities": {
    en: "Amenities",
    ar: "الخدمات",
    kur: "خزمەتگوزاریەکان",
  },
  "property.propertyInformation": {
    en: "Property Information",
    ar: "معلومات العقار",
    kur: "زانیاری خانووبەرە",
  },
  "property.propertyType": {
    en: "Property Type:",
    ar: "نوع العقار:",
    kur: "جۆری خانووبەرە",
  },
  "property.listed": {
    en: "Listed:",
    ar: "تاريخ الإدراج:",
    kur: "لیست کراوە",
  },
  "property.status": {
    en: "Status:",
    ar: "الحالة:",
    kur: "دۆخ",
  },
  "property.bedrooms": {
    en: "Bedrooms",
    ar: "غرف النوم",
    kur: "ژووری نوستن",
  },
  "property.bathrooms": {
    en: "Bathrooms",
    ar: "الحمامات",
    kur: "حەمام",
  },
  "property.sqFt": {
    en: "Sq Ft",
    ar: "قدم مربع",
    kur: "پێی چوارگۆشە",
  },
  "property.parking": {
    en: "Parking",
    ar: "موقف السيارات",
    kur: "پارک کردن",
  },
  "property.featured": {
    en: "Featured",
    ar: "مميز",
    kur: "تایبەت",
  },

  // Error states and additional labels
  "property.notFound": {
    en: "Property Not Found",
    ar: "العقار غير موجود",
    kur: "خانووبەرە نەدۆزرایەوە",
  },
  "property.notFoundDescription": {
    en: "The property you're looking for doesn't exist or has been removed.",
    ar: "العقار الذي تبحث عنه غير موجود أو تم حذفه.",
    kur: "ئەو خانووبەرەی کە بەدوایدا دەگەڕێیت بوونی نییە یان سڕاوەتەوە.",
  },
  "property.perSqFt": {
    en: "/sq ft",
    ar: "/قدم مربع",
    kur: "/پێی چوارگۆشە",
  },
  "property.perMonth": {
    en: "/mo",
    ar: "/شهريًا",
    kur: "/مانگانە",
  },
  "property.shareOnFacebook": {
    en: "Share on Facebook",
    ar: "مشاركة على فيسبوك",
    kur: "هاوبەشکردن لە فەیسبووک",
  },
  "property.shareOnTwitter": {
    en: "Share on Twitter",
    ar: "مشاركة على تويتر",
    kur: "هاوبەشکردن لە تویتەر",
  },
  "property.shareOnWhatsApp": {
    en: "Share on WhatsApp",
    ar: "مشاركة على واتساب",
    kur: "هاوبەشکردن لە واتساپ",
  },
  "property.shareOnLinkedIn": {
    en: "Share on LinkedIn",
    ar: "مشاركة على لينكد إن",
    kur: "هاوبەشکردن لە لینکدین",
  },
  "property.copyLink": {
    en: "Copy Link",
    ar: "نسخ الرابط",
    kur: "کۆپیکردنی بەستەر",
  },
  "property.linkCopied": {
    en: "Link Copied",
    ar: "تم نسخ الرابط",
    kur: "بەستەرەکە کۆپی کرا",
  },
  "property.linkCopiedDescription": {
    en: "Property link has been copied to your clipboard.",
    ar: "تم نسخ رابط العقار إلى الحافظة.",
    kur: "بەستەری خانووبەرەکە کۆپی کراوە بۆ کلیپ بۆردەکەت.",
  },
  "property.addedToFavorites": {
    en: "Added to Favorites",
    ar: "تمت الإضافة إلى المفضلة",
    kur: "زیادکرا بۆ بەرگری",
  },
  "property.addedToFavoritesDescription": {
    en: "Property has been added to your favorites.",
    ar: "تمت إضافة العقار إلى مفضلتك.",
    kur: "خانووبەرەکە زیادکرا بۆ بەرگریەکانت.",
  },
  "property.removedFromFavorites": {
    en: "Removed from Favorites",
    ar: "تمت الإزالة من المفضلة",
    kur: "لابرا لە بەرگری",
  },
  "property.removedFromFavoritesDescription": {
    en: "Property has been removed from your favorites.",
    ar: "تمت إزالة العقار من مفضلتك.",
    kur: "خانووبەرەکە لابرا لە بەرگریەکانت.",
  },
  "property.favoriteError": {
    en: "Error",
    ar: "خطأ",
    kur: "هەڵە",
  },
  "property.favoriteErrorDescription": {
    en: "Failed to update favorites. Please try again.",
    ar: "فشل في تحديث المفضلة. حاول مرة أخرى.",
    kur: "سەرکەوتوو نەبوو لە نوێکردنەوەی بەرگری. دووبارە هەوڵبدەوە.",
  },

  // Favorites Page
  "favorites.title": {
    en: "My Favorite Properties - MapEstate | Saved Property Listings",
    ar: "خصائصي المفضلة - MapEstate | قوائم العقارات المحفوظة",
    kur: "خانووبەرە بەرگریکراوەکانم - MapEstate | لیستی خانووبەرە پاشەکەوتکراوەکان",
  },
  "favorites.description": {
    en: "View your saved favorite properties. Keep track of houses, apartments, and villas you're interested in buying or renting in Kurdistan, Iraq.",
    ar: "اعرض خصائصك المفضلة المحفوظة. تتبع المنازل والشقق والفيلات التي تهتم بشرائها أو استئجارها في كردستان، العراق.",
    kur: "خانووبەرە بەرگریکراوەکانت ببینە. شوێنکەوتن بکە بۆ ماڵ، شوقە و ڤیلاکان کە بەرامبەرت بە کڕین یان کرێ لە کوردستان، عێراق.",
  },
  "favorites.loadingFavorites": {
    en: "Loading your favorites...",
    ar: "تحميل مفضلتك...",
    kur: "بارکردنی بەرگریەکانت...",
  },
  "favorites.errorLoading": {
    en: "Error loading favorites. Please try again.",
    ar: "خطأ في تحميل المفضلة. يرجى المحاولة مرة أخرى.",
    kur: "هەڵە لە بارکردنی بەرگریەکان. تکایە دووبارە هەوڵبدەوە.",
  },
  "favorites.noFavoritesYet": {
    en: "No favorites yet",
    ar: "لا توجد مفضلة بعد",
    kur: "هێشتا هیچ بەرگریەک نییە",
  },
  "favorites.noFavoritesDescription": {
    en: "Start adding properties to your favorites by clicking the heart icon on property listings.",
    ar: "ابدأ في إضافة العقارات إلى مفضلتك بالنقر على أيقونة القلب في قوائم العقارات.",
    kur: "دەست بکە بە زیادکردنی خانووبەرەکان بۆ بەرگریەکانت لە ڕێگەی کرتەکردن لەسەر نیشانەی دڵ لە لیستی خانووبەرەکان.",
  },
  "favorites.structuredDataName": {
    en: "My Favorite Properties",
    ar: "خصائصي المفضلة",
    kur: "خانووبەرە بەرگریکراوەکانم",
  },
  "favorites.structuredDataDescription": {
    en: "saved favorite properties. Keep track of properties you're interested in buying or renting.",
    ar: "خصائص مفضلة محفوظة. تتبع العقارات التي تهتم بشرائها أو استئجارها.",
    kur: "خانووبەرە بەرگریکراوە پاشەکەوتکراوەکان. شوێنکەوتن بکە بۆ خانووبەرەکان کە بەرامبەرت بە کڕین یان کرێ.",
  },

  // Property Features
  // Property Amenities (Keys from customer dashboard form)
  "property.amenities.swimmingPool": {
    en: "Swimming Pool",
    ar: "مسبح",
    kur: "حەوزی مەلەکردن",
  },
  "property.amenities.garden": {
    en: "Garden",
    ar: "حديقة",
    kur: "باخچە",
  },
  "property.amenities.parking": {
    en: "Parking",
    ar: "موقف سيارات",
    kur: "پارک کردن",
  },
  "property.amenities.securitySystem": {
    en: "Security System",
    ar: "نظام الأمان",
    kur: "سیستەمی ئاسایش",
  },
  "property.amenities.elevator": {
    en: "Elevator",
    ar: "مصعد",
    kur: "ئاسانسۆر",
  },
  "property.amenities.gym": {
    en: "Gym",
    ar: "نادي رياضي",
    kur: "زالی وەرزش",
  },
  "property.amenities.balcony": {
    en: "Balcony",
    ar: "شرفة",
    kur: "بالاخانە",
  },
  "property.amenities.terrace": {
    en: "Terrace",
    ar: "تراس",
    kur: "تاراسە",
  },

  // Property Features (Keys from customer dashboard form)
  "property.features.airConditioning": {
    en: "Air Conditioning",
    ar: "تكييف الهواء",
    kur: "ڕەش‌کردنەوە",
  },
  "property.features.heating": {
    en: "Heating",
    ar: "تدفئة",
    kur: "گەرمکردنەوە",
  },
  "property.features.furnished": {
    en: "Furnished",
    ar: "مؤثث",
    kur: "فەرنیچەردار",
  },
  "property.features.petFriendly": {
    en: "Pet Friendly",
    ar: "مناسب للحيوانات الأليفة",
    kur: "گونجاو بۆ ئاژەڵی ماڵی",
  },
  "property.features.fireplace": {
    en: "Fireplace",
    ar: "مدفأة",
    kur: "بخاری",
  },
  "property.features.highCeilings": {
    en: "High Ceilings",
    ar: "أسقف عالية",
    kur: "سەقفی بەرز",
  },
  "property.features.modernKitchen": {
    en: "Modern Kitchen",
    ar: "مطبخ عصري",
    kur: "چێشتخانەی مۆدێرن",
  },
  "property.features.storageRoom": {
    en: "Storage Room",
    ar: "غرفة تخزين",
    kur: "ژووری هەڵگرتن",
  },

  // Legacy translations for backward compatibility
  "property.amenities.gardenPatio": {
    en: "Garden & Patio",
    ar: "حديقة وشرفة",
    kur: "باخچە و بالاخانە",
  },
  "property.amenities.garageParking": {
    en: "Garage Parking",
    ar: "موقف السيارات",
    kur: "پارک کردنی گاراژ",
  },

  // Settings Page
  "settings.title": {
    en: "Settings - MapEstate",
    ar: "الإعدادات - MapEstate",
    kur: "ڕێکخستنەکان - MapEstate",
  },
  "settings.backToHome": {
    en: "Back to Home",
    ar: "العودة للرئيسية",
    kur: "گەڕانەوە بۆ سەرەتا",
  },
  "settings.languageRegion": {
    en: "Language & Region",
    ar: "اللغة والمنطقة",
    kur: "زمان و ناوچە",
  },
  "settings.language": {
    en: "Language",
    ar: "اللغة",
    kur: "زمان",
  },
  "settings.currency": {
    en: "Currency",
    ar: "العملة",
    kur: "دراو",
  },
  "settings.dateFormat": {
    en: "Date Format",
    ar: "تنسيق التاريخ",
    kur: "شێوازی بەروار",
  },
  "settings.notifications": {
    en: "Notifications",
    ar: "الإشعارات",
    kur: "ئاگاداریەکان",
  },
  "settings.emailNotifications": {
    en: "Email Notifications",
    ar: "إشعارات البريد الإلكتروني",
    kur: "ئاگاداری ئیمەیڵ",
  },
  "settings.emailNotificationsDesc": {
    en: "Receive updates via email",
    ar: "تلقي التحديثات عبر البريد الإلكتروني",
    kur: "وەرگرتنی نوێکردنەوە بە ئیمەیڵ",
  },
  "settings.pushNotifications": {
    en: "Push Notifications",
    ar: "الإشعارات الفورية",
    kur: "ئاگاداری فوری",
  },
  "settings.pushNotificationsDesc": {
    en: "Browser notifications",
    ar: "إشعارات المتصفح",
    kur: "ئاگاداری وێبگەڕ",
  },
  "settings.favoriteUpdates": {
    en: "Favorite Property Updates",
    ar: "تحديثات العقارات المفضلة",
    kur: "نوێکردنەوەی خانووبەرە بەرگریکراوەکان",
  },
  "settings.favoriteUpdatesDesc": {
    en: "Notify when favorite properties change",
    ar: "تنبيه عند تغيير العقارات المفضلة",
    kur: "ئاگادارکردنەوە کاتێک خانووبەرە بەرگریکراوەکان دەگۆڕێن",
  },
  "settings.priceAlerts": {
    en: "Price Drop Alerts",
    ar: "تنبيهات انخفاض الأسعار",
    kur: "ئاگاداری دابەزینی نرخ",
  },
  "settings.priceAlertsDesc": {
    en: "Alert when property prices drop",
    ar: "تنبيه عند انخفاض أسعار العقارات",
    kur: "ئاگادارکردنەوە کاتێک نرخی خانووبەرەکان دادەبەزێت",
  },
  "settings.displayPreferences": {
    en: "Display Preferences",
    ar: "تفضيلات العرض",
    kur: "ویستی نیشاندان",
  },
  "settings.mapStyle": {
    en: "Map Style",
    ar: "نمط الخريطة",
    kur: "شێوازی نەخشە",
  },
  "settings.showPropertyPrices": {
    en: "Show Property Prices",
    ar: "إظهار أسعار العقارات",
    kur: "نیشاندانی نرخی خانووبەرەکان",
  },
  "settings.showPropertyPricesDesc": {
    en: "Display prices on map markers",
    ar: "عرض الأسعار على علامات الخريطة",
    kur: "نیشاندانی نرخەکان لەسەر نیشانەکانی نەخشە",
  },
  "settings.showDistance": {
    en: "Show Distance",
    ar: "إظهار المسافة",
    kur: "نیشاندانی مەودا",
  },
  "settings.showDistanceDesc": {
    en: "Show distance from your location",
    ar: "إظهار المسافة من موقعك",
    kur: "نیشاندانی مەودا لە شوێنت",
  },
  "settings.autoZoom": {
    en: "Auto Zoom to Results",
    ar: "تكبير تلقائي للنتائج",
    kur: "گەورەکردنەوەی خۆکارانە بۆ ئەنجامەکان",
  },
  "settings.autoZoomDesc": {
    en: "Automatically zoom map to show search results",
    ar: "تكبير الخريطة تلقائياً لإظهار نتائج البحث",
    kur: "گەورەکردنەوەی نەخشە بە شێوەی خۆکارانە بۆ نیشاندانی ئەنجامی گەڕان",
  },
  "settings.cancel": {
    en: "Cancel",
    ar: "إلغاء",
    kur: "هەڵوەشاندنەوە",
  },
  "settings.saveSettings": {
    en: "Save Settings",
    ar: "حفظ الإعدادات",
    kur: "پاشەکەوتکردنی ڕێکخستنەکان",
  },
  "settings.settingsSaved": {
    en: "Settings saved successfully!",
    ar: "تم حفظ الإعدادات بنجاح!",
    kur: "ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران!",
  },
  "settings.mapStyleDefault": {
    en: "Default",
    ar: "افتراضي",
    kur: "بنەڕەتی",
  },
  "settings.mapStyleSatellite": {
    en: "Satellite",
    ar: "قمر صناعي",
    kur: "هەواربەرە",
  },
  "settings.mapStyleTerrain": {
    en: "Terrain",
    ar: "تضاريس",
    kur: "دۆزران",
  },
  "settings.profileInformation": {
    en: "Profile Information",
    ar: "معلومات الملف الشخصي",
    kur: "زانیاری پڕۆفایل",
  },
  "settings.displayName": {
    en: "Display Name",
    ar: "اسم العرض",
    kur: "ناوی نیشاندان",
  },
  "settings.displayNamePlaceholder": {
    en: "Your name",
    ar: "اسمك",
    kur: "ناوت",
  },
  "settings.email": {
    en: "Email",
    ar: "البريد الإلكتروني",
    kur: "ئیمەیڵ",
  },
  "settings.emailPlaceholder": {
    en: "your.email@example.com",
    ar: "your.email@example.com",
    kur: "your.email@example.com",
  },
  "settings.phone": {
    en: "Phone Number",
    ar: "رقم الهاتف",
    kur: "ژمارەی تەلەفۆن",
  },
  "settings.phonePlaceholder": {
    en: "+964 xxx xxx xxxx",
    ar: "+964 xxx xxx xxxx",
    kur: "+964 xxx xxx xxxx",
  },
  "settings.settingsPreferences": {
    en: "Settings & Preferences",
    ar: "الإعدادات والتفضيلات",
    kur: "ڕێکخستن و ویستەکان",
  },
  "settings.settingsDescription": {
    en: "Customize your profile, language, notifications, and display preferences.",
    ar: "تخصيص ملفك الشخصي واللغة والإشعارات وتفضيلات العرض.",
    kur: "دەستکاریکردنی پڕۆفایل، زمان، ئاگاداری و ویستی نیشاندان.",
  },

  // Home page and menu items
  "menu.myFavorites": {
    en: "My Favorites",
    ar: "المفضلة",
    kur: "بەرگریەکانم",
  },
  "menu.settings": {
    en: "Settings",
    ar: "الإعدادات",
    kur: "ڕێکخستنەکان",
  },
  "menu.darkMode": {
    en: "Dark Mode",
    ar: "الوضع المظلم",
    kur: "دۆخی تاریک",
  },
  "menu.lightMode": {
    en: "Light Mode",
    ar: "الوضع الفاتح",
    kur: "دۆخی ڕووناک",
  },
  "menu.signOut": {
    en: "Sign Out",
    ar: "تسجيل الخروج",
    kur: "چوونەدەرەوە",
  },
  "home.properties": {
    en: "properties",
    ar: "عقار",
    kur: "خانووبەرە",
  },
  "home.loadingMap": {
    en: "Loading map...",
    ar: "تحميل الخريطة...",
    kur: "بارکردنی نەخشە...",
  },

  // Filter labels
  "filter.listingType": {
    en: "Listing Type",
    ar: "نوع الإعلان",
    kur: "جۆری لیستکردن",
  },
  "filter.propertyType": {
    en: "Property Type",
    ar: "نوع العقار",
    kur: "جۆری خانووبەرە",
  },
  "filter.bedrooms": {
    en: "Bedrooms",
    ar: "غرف النوم",
    kur: "ژووری نوستن",
  },
  "filter.beds": {
    en: "Beds",
    ar: "أسرة",
    kur: "جێخەوەکان",
  },
  "filter.bathrooms": {
    en: "Bathrooms",
    ar: "الحمامات",
    kur: "حەمامەکان",
  },
  "filter.baths": {
    en: "Baths",
    ar: "حمامات",
    kur: "حەمام",
  },
  "filter.city": {
    en: "City",
    ar: "المدينة",
    kur: "شار",
  },
  "filter.cityPlaceholder": {
    en: "e.g. Erbil, Baghdad",
    ar: "مثل: أربيل، بغداد",
    kur: "وەک: هەولێر، بەغدا",
  },
  "filter.priceRange": {
    en: "Price Range",
    ar: "نطاق السعر",
    kur: "نرخی نێوان",
  },
  "filter.priceRangeLabel": {
    en: "Price Range:",
    ar: "نطاق السعر:",
    kur: "نرخی نێوان:",
  },

  // About Us Page
  "about.title": {
    en: "About MapEstate",
    ar: "حول MapEstate",
    kur: "دەربارەی MapEstate",
  },
  "about.subtitle": {
    en: "Your Trusted Real Estate Partner",
    ar: "شريكك الموثوق في العقارات",
    kur: "هاوبەشی متمانەپێکراوت لە خانووبەرە",
  },
  "about.ourMission": {
    en: "Our Mission",
    ar: "مهمتنا",
    kur: "ئامانجمان",
  },
  "about.missionText": {
    en: "At MapEstate, we are dedicated to revolutionizing the real estate experience through cutting-edge technology and personalized service. Our mission is to make property buying, selling, and renting accessible, transparent, and efficient for everyone.",
    ar: "في MapEstate، نحن ملتزمون بثورة تجربة العقارات من خلال التكنولوجيا المتطورة والخدمة الشخصية. مهمتنا هي جعل شراء وبيع وتأجير العقارات في متناول الجميع وشفافة وفعالة.",
    kur: "لە MapEstate، ئێمە پابەندین بە شۆڕشگێڕی ئەزموونی خانووبەرە لە ڕێگەی تەکنەلۆژیای پێشکەوتوو و خزمەتگوزاری کەسی. ئامانجمان ئەوەیە کە کڕین و فرۆشتن و کرێدانی خانووبەرە بکەینە دەستڕاگەیشتوو، ڕوونی و کاریگەر بۆ هەمووان.",
  },
  "about.ourStory": {
    en: "Our Story",
    ar: "قصتنا",
    kur: "چیرۆکمان",
  },
  "about.storyText": {
    en: "Founded with a vision to bridge the gap between traditional real estate practices and modern technology, MapEstate has grown to become a leading platform in the region. We combine local market expertise with innovative AI-powered search capabilities to help you find your perfect property.",
    ar: "تأسست برؤية لسد الفجوة بين ممارسات العقارات التقليدية والتكنولوجيا الحديثة، نمت MapEstate لتصبح منصة رائدة في المنطقة. نحن نجمع بين خبرة السوق المحلية وقدرات البحث المبتكرة المدعومة بالذكاء الاصطناعي لمساعدتك في العثور على العقار المثالي.",
    kur: "بە بینینێک دامەزراوە بۆ پڕکردنەوەی بۆشاییەکە لە نێوان پراکتیزەکانی خانووبەرەی نەریتی و تەکنەلۆژیای مۆدێرن، MapEstate گەشەی کردووە و بووەتە پلاتفۆرمێکی پێشەنگ لە هەرێمەکە. ئێمە شارەزایی بازاڕی خۆجێیی تێکەڵ دەکەین لەگەڵ توانای گەڕانی داهێنەری پاڵپشتیکراو بە AIەوە بۆ یارمەتیدانت لە دۆزینەوەی خانووبەرە تەواوەکەت.",
  },
  "about.ourValues": {
    en: "Our Values",
    ar: "قيمنا",
    kur: "بەهاکانمان",
  },
  "about.valueTransparency": {
    en: "Transparency",
    ar: "الشفافية",
    kur: "ڕوونی",
  },
  "about.valueTransparencyText": {
    en: "We believe in complete transparency in all our dealings, providing accurate and up-to-date information.",
    ar: "نؤمن بالشفافية الكاملة في جميع تعاملاتنا، وتوفير معلومات دقيقة ومحدثة.",
    kur: "ئێمە باوەڕمان بە ڕوونی تەواو هەیە لە هەموو مامەڵەکانماندا، پێدانی زانیاری وردی نوێکراوە.",
  },
  "about.valueInnovation": {
    en: "Innovation",
    ar: "الابتكار",
    kur: "داهێنان",
  },
  "about.valueInnovationText": {
    en: "We continuously innovate to provide the best user experience with cutting-edge technology.",
    ar: "نبتكر باستمرار لتوفير أفضل تجربة مستخدم بتكنولوجيا متطورة.",
    kur: "ئێمە بەردەوام داهێنان دەکەین بۆ دابینکردنی باشترین ئەزموونی بەکارهێنەر بە تەکنەلۆژیای پێشکەوتوو.",
  },
  "about.valueExcellence": {
    en: "Excellence",
    ar: "التميز",
    kur: "باشی",
  },
  "about.valueExcellenceText": {
    en: "We strive for excellence in every aspect of our service, from customer support to property listings.",
    ar: "نسعى للتميز في كل جانب من جوانب خدمتنا، من دعم العملاء إلى قوائم العقارات.",
    kur: "ئێمە هەوڵ دەدەین بۆ باشی لە هەموو لایەکی خزمەتگوزاریەکانمان، لە پاڵپشتی کڕیارەوە تا لیستی خانووبەرەکان.",
  },
  "about.whyChooseUs": {
    en: "Why Choose MapEstate?",
    ar: "لماذا تختار MapEstate؟",
    kur: "بۆچی MapEstate هەڵبژێریت؟",
  },
  "about.featureAI": {
    en: "AI-Powered Search",
    ar: "بحث مدعوم بالذكاء الاصطناعي",
    kur: "گەڕانی پاڵپشتیکراو بە AI",
  },
  "about.featureAIText": {
    en: "Find properties using natural language queries and get intelligent recommendations.",
    ar: "ابحث عن العقارات باستخدام استعلامات اللغة الطبيعية واحصل على توصيات ذكية.",
    kur: "خانووبەرەکان بدۆزەرەوە بە بەکارهێنانی پرسیاری زمانی سروشتی و پێشنیاری زیرەک وەربگرە.",
  },
  "about.featureLocal": {
    en: "Local Expertise",
    ar: "خبرة محلية",
    kur: "شارەزایی خۆجێیی",
  },
  "about.featureLocalText": {
    en: "Our team has deep knowledge of the local real estate market and regulations.",
    ar: "فريقنا لديه معرفة عميقة بسوق العقارات المحلي واللوائح.",
    kur: "تیمەکەمان زانیاری قووڵی هەیە لە بازاڕی خانووبەرەی خۆجێیی و یاساکان.",
  },
  "about.featureSupport": {
    en: "24/7 Support",
    ar: "دعم على مدار الساعة",
    kur: "پشتگیری ٢٤/٧",
  },
  "about.featureSupportText": {
    en: "Get assistance whenever you need it with our dedicated customer support team.",
    ar: "احصل على المساعدة متى احتجت إليها مع فريق دعم العملاء المخصص لدينا.",
    kur: "یارمەتی وەربگرە کاتێک پێویستت پێیەتی لەگەڵ تیمی تایبەتی پشتگیری کڕیارەکانمان.",
  },
  "about.contactUs": {
    en: "Contact Us",
    ar: "اتصل بنا",
    kur: "پەیوەندیمان پێوە بکە",
  },
  "about.contactText": {
    en: "Ready to find your dream property? Get in touch with our team today.",
    ar: "جاهز للعثور على عقار أحلامك؟ تواصل مع فريقنا اليوم.",
    kur: "ئامادەیت بۆ دۆزینەوەی خانووبەرەی خەونەکانت؟ ئەمڕۆ پەیوەندی بە تیمەکەمانەوە بکە.",
  },
  "about.backToHome": {
    en: "Back to Home",
    ar: "العودة للرئيسية",
    kur: "گەڕانەوە بۆ سەرەتا",
  },

  // Filter options
  "filter.allTypes": {
    en: "All Types",
    ar: "جميع الأنواع",
    kur: "هەموو جۆرەکان",
  },
  "filter.allProperties": {
    en: "All Properties",
    ar: "جميع العقارات",
    kur: "هەموو خانووبەرەکان",
  },
  "filter.house": {
    en: "House",
    ar: "منزل",
    kur: "ماڵ",
  },
  "filter.apartment": {
    en: "Apartment",
    ar: "شقة",
    kur: "شوقە",
  },
  "filter.villa": {
    en: "Villa",
    ar: "فيلا",
    kur: "ڤیلا",
  },
  "filter.land": {
    en: "Land",
    ar: "أرض",
    kur: "زەوی",
  },
  "filter.any": {
    en: "Any",
    ar: "أي",
    kur: "هەر",
  },
  "filter.clearAll": {
    en: "Clear All",
    ar: "مسح الكل",
    kur: "پاککردنەوەی هەموو",
  },
  "filter.activeFilters": {
    en: "Active filters:",
    ar: "المرشحات النشطة:",
    kur: "فلتەرە چالاکەکان:",
  },
  "filter.clear": {
    en: "Clear",
    ar: "مسح",
    kur: "پاککردنەوە",
  },

  // Search and AI
  "search.aiPlaceholder": {
    en: "Ask AI: 'Find me a 3-bedroom villa under $300k in Erbil'",
    ar: "اسأل الذكاء الاصطناعي: 'ابحث لي عن فيلا بـ 3 غرف نوم تحت 300 ألف دولار في أربيل'",
    kur: "لە AI بپرسە: 'ڤیلایەکی 3 ژووری نوستن بدۆزەرەوە کە کەمتر لە 300 هەزار دۆلار بێت لە هەولێر'",
  },

  // Map
  "map.loadingTitle": {
    en: "Loading Interactive Map",
    ar: "تحميل الخريطة التفاعلية",
    kur: "بارکردنی نەخشەی کارلێکەر",
  },
  "map.loadingDescription": {
    en: "Discovering amazing properties for you...",
    ar: "نكتشف عقارات مذهلة لك...",
    kur: "خانووبەرە نایابەکان بۆت دەدۆزینەوە...",
  },
  "map.poweredBy": {
    en: "🗺️ Powered by OpenStreetMap & Leaflet.js",
    ar: "🗺️ مدعوم بواسطة OpenStreetMap و Leaflet.js",
    kur: "🗺️ پشتگیری لەلایەن OpenStreetMap و Leaflet.js",
  },
  "map.propertiesIn": {
    en: "Properties in",
    ar: "العقارات في",
    kur: "خانووبەرە لە",
  },
  "map.propertiesInThisArea": {
    en: "Properties in this area",
    ar: "العقارات في هذه المنطقة",
    kur: "خانووبەرە لەم ناوچەیەدا",
  },
};

// Global language change event system
const LANGUAGE_CHANGE_EVENT = "languageChange";

// Global function to change language and notify all components
// Debouncing mechanism for language changes
let languageChangeTimeout: NodeJS.Timeout | null = null;
let pendingLanguageChange: { lang: Language; persist: boolean } | null = null;

function applyLanguageChanges(lang: Language, persist: boolean) {
  // Batch DOM updates using requestAnimationFrame for smoother performance
  requestAnimationFrame(() => {
    // Update localStorage first
    if (persist) {
      localStorage.setItem("language", lang);
    }

    // Batch all DOM updates together to prevent layout thrashing
    const isRTL = lang === "ar" || lang === "kur";

    // Update document attributes
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;

    // Apply font changes
    const body = document.body;
    body.classList.remove("arabic-font", "kurdish-font");

    if (lang === "ar") {
      body.classList.add("arabic-font");
      body.style.fontFamily = "var(--font-arabic)";
    } else if (lang === "kur") {
      body.classList.add("kurdish-font");
      body.style.fontFamily = "var(--font-kurdish)";
    } else {
      body.style.fontFamily = "var(--font-sans)";
    }

    // Dispatch event after DOM updates are complete
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language: lang } }),
      );
    });
  });
}

export function globalChangeLanguage(lang: Language, persist: boolean = true) {
  // Clear any pending language change
  if (languageChangeTimeout) {
    clearTimeout(languageChangeTimeout);
  }

  // Store the pending change
  pendingLanguageChange = { lang, persist };

  // Debounce rapid language changes (useful during initialization)
  languageChangeTimeout = setTimeout(() => {
    if (pendingLanguageChange) {
      applyLanguageChanges(
        pendingLanguageChange.lang,
        pendingLanguageChange.persist,
      );
      pendingLanguageChange = null;
    }
    languageChangeTimeout = null;
  }, 50); // Small delay to batch rapid changes
}

export function useTranslation() {
  const [language, setLanguage] = useState<Language>(() => {
    // Initialize from localStorage
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage && ["en", "ar", "kur"].includes(savedLanguage)
      ? savedLanguage
      : "en";
  });

  // Only apply DOM changes on initial load, not on subsequent state changes
  // to prevent conflicts with globalChangeLanguage function
  const initialLanguageRef = useRef<Language | null>(null);

  useEffect(() => {
    // Only apply DOM changes on the first render
    if (initialLanguageRef.current === null) {
      initialLanguageRef.current = language;

      document.documentElement.dir =
        language === "ar" || language === "kur" ? "rtl" : "ltr";
      document.documentElement.lang = language;

      // Apply appropriate font based on language
      if (language === "ar") {
        document.body.classList.add("arabic-font");
        document.body.classList.remove("kurdish-font");
        document.body.style.fontFamily = "var(--font-arabic)";
      } else if (language === "kur") {
        document.body.classList.add("kurdish-font");
        document.body.classList.remove("arabic-font");
        document.body.style.fontFamily = "var(--font-kurdish)";
      } else {
        document.body.classList.remove("arabic-font", "kurdish-font");
        document.body.style.fontFamily = "var(--font-sans)";
      }
    }
  }, [language]);

  useEffect(() => {
    // Listen for global language change events
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener(
      LANGUAGE_CHANGE_EVENT,
      handleLanguageChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        LANGUAGE_CHANGE_EVENT,
        handleLanguageChange as EventListener,
      );
    };
  }, []);

  const changeLanguage = (lang: Language, persist: boolean = true) => {
    globalChangeLanguage(lang, persist);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  // Localization fallback helper for property content
  const getLocalized = (content: any, fallback: string = "") => {
    if (!content) return fallback;

    // If content is already a string, return it
    if (typeof content === "string") return content;

    // If content is an object with language keys, use fallback logic
    if (typeof content === "object") {
      return (
        content[language] || content.en || content.ar || content.kur || fallback
      );
    }

    return fallback;
  };

  return {
    language,
    changeLanguage,
    t,
    getLocalized,
    isRTL: language === "ar" || language === "kur",
  };
}

// Hook to get current language state
export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem("language") as Language) || 'en';
  });

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguage(event.detail.language);
    };
    
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);
  }, []);

  return { language };
}

// Detect language from URL path
export function detectLanguageFromUrl(url: string): Language | null {
  const path = url.startsWith('/') ? url : '/' + url;
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length === 0) return null;
  
  const firstSegment = segments[0];
  if (firstSegment === 'en' || firstSegment === 'ar' || firstSegment === 'kur') {
    return firstSegment as Language;
  }
  
  return null;
}

// Redirect to language-prefixed URL
export function redirectToLanguage(language: Language, currentPath: string, setLocation: (path: string) => void) {
  // Remove existing language prefix if present
  const cleanPath = currentPath.replace(/^\/(en|ar|kur)/, '') || '/';
  
  // Add new language prefix - always include trailing slash for home route
  const newPath = `/${language}${cleanPath}`;
  
  setLocation(newPath);
}

// Get localized path for a given route (idempotent)
export function getLocalizedPath(path: string, language: Language): string {
  // Ensure path starts with a leading slash
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Remove existing language prefix if present to ensure idempotency
  cleanPath = cleanPath.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  
  // Add language prefix - always maintain leading slash
  return `/${language}${cleanPath}`;
}
