import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { 
    PromotionalContent, PromotionalContentInsert, PromotionalContentUpdate, 
    Product, Category, BlogPost, Recipe, StoreSettings
} from '../types';

type Page = 'home' | 'shop' | 'product' | 'about' | 'recipes' | 'contact' | 'login' | 'signup' | 'profile' | 'checkout' | 'recipeDetail' | 'admin' | 'wishlist' | 'compare' | 'legal' | 'combos' | 'influencer' | 'partners' | 'applyInfluencer' | 'sitemap' | 'social' | 'notFound' | 'cart';

const primaryButtonStyles = "bg-hav-forest text-hav-gold hover:bg-hav-forest/90 hover:shadow-lg border border-hav-gold/20 font-bold py-2.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-center";
const secondaryButtonStyles = "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold py-2.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-center";

const modalInputStyles = "mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-hav-gold focus:ring-2 focus:ring-hav-gold/20 outline-none";

const PAGE_ROUTE_OPTIONS = [
  { value: 'home', label: 'Home Page' },
  { value: 'shop', label: 'Shop (All Products)' },
  { value: 'combos', label: 'Combos & Gift Boxes' },
  { value: 'recipes', label: 'Recipes' },
  { value: 'contact', label: 'Contact Us' },
  { value: 'about', label: 'About Our Brand' },
  { value: 'influencer', label: 'Influencer Portal' },
];

interface BannersShelfStudioProps {
    promotionalContent: PromotionalContent[];
    onSavePromoContent: (data: any, id?: string) => Promise<boolean>;
    onDeletePromoContent: (id: string) => Promise<boolean>;
    products: Product[];
    categories: Category[];
    recipes: Recipe[];
    blogPosts: BlogPost[];
    storeSettings: StoreSettings | null;
    fetchData: () => void;
}

export const BannersShelfStudio: React.FC<BannersShelfStudioProps> = ({
    promotionalContent,
    onSavePromoContent,
    onDeletePromoContent,
    products,
    categories,
    recipes,
    blogPosts,
    storeSettings,
    fetchData
}) => {
    const [activeTab, setActiveTab] = useState<'shelf' | 'carousel'>('shelf');
    const [uploading, setUploading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenDevice, setFullscreenDevice] = useState<'widescreen' | 'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isWideWorkspace, setIsWideWorkspace] = useState(false);
    const [previewMode, setPreviewMode] = useState<'edit' | 'replica'>('edit');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

    // Global Banner Controls States
    const [isBannerEnabled, setIsBannerEnabled] = useState<boolean>(true);
    const [globalDuration, setGlobalDuration] = useState<number>(7);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (storeSettings) {
            setIsBannerEnabled(storeSettings.is_banner_carousel_enabled !== false);
            setGlobalDuration(storeSettings.global_banner_duration || 7);
        }
    }, [storeSettings]);

    // Smooth drag tracking states
    const [draggingButtonId, setDraggingButtonId] = useState<string | null>(null);
    const [draggingShelfBtn, setDraggingShelfBtn] = useState<1 | 2 | null>(null);
    const [draggingImage, setDraggingImage] = useState<boolean>(false);
    const [draggingText, setDraggingText] = useState<boolean>(false);

    // Dynamic scale resizing states
    const [isResizingImage, setIsResizingImage] = useState<boolean>(false);
    const resizeStartRef = useRef<{ centerX: number; centerY: number; initialDistance: number; initialScale: number } | null>(null);

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawingMode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
        setDrawStart({ x: xPercent, y: yPercent });
        setDrawCurrent({ x: xPercent, y: yPercent });
    };

    const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isDrawingMode) return;
        const touch = e.touches[0];
        if (!touch) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((touch.clientY - rect.top) / rect.height) * 100;
        setDrawStart({ x: xPercent, y: yPercent });
        setDrawCurrent({ x: xPercent, y: yPercent });
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDrawingMode && drawStart) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
            setDrawCurrent({ x: Math.min(Math.max(xPercent, 0), 100), y: Math.min(Math.max(yPercent, 0), 100) });
            return;
        }

        if (draggingButtonId) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 2), 98));
            const boundedY = Math.round(Math.min(Math.max(yPercent, 2), 98));
            updateLayoutButtonValue(draggingButtonId, 'x', boundedX);
            updateLayoutButtonValue(draggingButtonId, 'y', boundedY);
        } else if (isResizingImage && resizeStartRef.current) {
            const currentDistance = Math.hypot(e.clientX - resizeStartRef.current.centerX, e.clientY - resizeStartRef.current.centerY);
            const ratio = currentDistance / (resizeStartRef.current.initialDistance || 1);
            const newScale = Math.round(Math.max(10, Math.min(300, resizeStartRef.current.initialScale * ratio)));
            updateLayoutValue('image_scale', newScale);
        } else if (draggingImage) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 2), 98));
            const boundedY = Math.round(Math.min(Math.max(yPercent, 2), 98));
            updateLayoutValue('image_x', boundedX);
            updateLayoutValue('image_y', boundedY);
        } else if (draggingText) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 2), 98));
            const boundedY = Math.round(Math.min(Math.max(yPercent, 2), 98));
            updateLayoutValue('text_x', boundedX);
            updateLayoutValue('text_y', boundedY);
        } else if (draggingShelfBtn) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 5), 95));
            setShelfConfig((prev: any) => ({
                ...prev,
                [`btn${draggingShelfBtn}_x`]: boundedX
            }));
        }
    };

    const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        if (!touch) return;

        if (isDrawingMode && drawStart) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((touch.clientY - rect.top) / rect.height) * 100;
            setDrawCurrent({ x: Math.min(Math.max(xPercent, 0), 100), y: Math.min(Math.max(yPercent, 0), 100) });
            return;
        }

        if (draggingButtonId) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((touch.clientY - rect.top) / rect.height) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 2), 98));
            const boundedY = Math.round(Math.min(Math.max(yPercent, 2), 98));
            updateLayoutButtonValue(draggingButtonId, 'x', boundedX);
            updateLayoutButtonValue(draggingButtonId, 'y', boundedY);
        } else if (isResizingImage && resizeStartRef.current) {
            const currentDistance = Math.hypot(touch.clientX - resizeStartRef.current.centerX, touch.clientY - resizeStartRef.current.centerY);
            const ratio = currentDistance / (resizeStartRef.current.initialDistance || 1);
            const newScale = Math.round(Math.max(10, Math.min(300, resizeStartRef.current.initialScale * ratio)));
            updateLayoutValue('image_scale', newScale);
        } else if (draggingImage) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((touch.clientY - rect.top) / rect.height) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 2), 98));
            const boundedY = Math.round(Math.min(Math.max(yPercent, 2), 98));
            updateLayoutValue('image_x', boundedX);
            updateLayoutValue('image_y', boundedY);
        } else if (draggingText) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((touch.clientY - rect.top) / rect.height) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 2), 98));
            const boundedY = Math.round(Math.min(Math.max(yPercent, 2), 98));
            updateLayoutValue('text_x', boundedX);
            updateLayoutValue('text_y', boundedY);
        } else if (draggingShelfBtn) {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;
            const boundedX = Math.round(Math.min(Math.max(xPercent, 5), 95));
            setShelfConfig((prev: any) => ({
                ...prev,
                [`btn${draggingShelfBtn}_x`]: boundedX
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        if (isDrawingMode && drawStart && drawCurrent) {
            const minX = Math.min(drawStart.x, drawCurrent.x);
            const maxX = Math.max(drawStart.x, drawCurrent.x);
            const minY = Math.min(drawStart.y, drawCurrent.y);
            const maxY = Math.max(drawStart.y, drawCurrent.y);
            
            const widthPct = maxX - minX;
            const heightPct = maxY - minY;
            
            if (widthPct > 2 && heightPct > 2) {
                let canvasWidthPx = 800;
                let canvasHeightPx = 450;
                
                if (interactiveCanvasRef.current) {
                    const rect = interactiveCanvasRef.current.getBoundingClientRect();
                    canvasWidthPx = rect.width;
                    canvasHeightPx = rect.height;
                } else if (previewBannerRef.current) {
                    const rect = previewBannerRef.current.getBoundingClientRect();
                    canvasWidthPx = rect.width;
                    canvasHeightPx = rect.height;
                }
                
                const widthPx = Math.round((widthPct / 100) * canvasWidthPx);
                const heightPx = Math.round((heightPct / 100) * canvasHeightPx);
                
                const centerX = Math.round(minX + widthPct / 2);
                const centerY = Math.round(minY + heightPct / 2);

                const currentButtons = bannerForm.button_link_context?.buttons || [];
                const newHotspotBtn = {
                    id: `btn-${Date.now()}`,
                    text: `Hotspot Area ${currentButtons.length + 1}`,
                    link_page: "shop",
                    link_path: "",
                    x: centerX,
                    y: centerY,
                    width: widthPx,
                    height: heightPx,
                    is_hotspot: true,
                    bg_color: "rgba(0,0,0,0)",
                    text_color: "rgba(0,0,0,0)",
                    border_radius: "sharp"
                };

                setBannerForm((prev: any) => {
                    const btns = prev.button_link_context?.buttons || [];
                    return {
                        ...prev,
                        button_link_context: {
                            ...prev.button_link_context,
                            buttons: [...btns, newHotspotBtn]
                        }
                    };
                });
                
                setIsDrawingMode(false);
            }
            setDrawStart(null);
            setDrawCurrent(null);
        }

        setDraggingButtonId(null);
        setDraggingShelfBtn(null);
        setDraggingImage(false);
        setDraggingText(false);
        setIsResizingImage(false);
    };

    // Filter image carousel banners
    const carouselBanners = promotionalContent.filter(c => c.type === 'image_carousel');

    // ----------------------------------------------------
    // TAB 1: INFINITE MOVING SHELF CONTROLS
    // ----------------------------------------------------
    const [shelfConfig, setShelfConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('hav_infinite_shelf_config');
            if (saved) return JSON.parse(saved);
        } catch (e) {}

        // Look for settings inside storeSettings
        if (storeSettings && (storeSettings as any).infinite_shelf_config) {
            return (storeSettings as any).infinite_shelf_config;
        }

        return {
            isActive: true,
            line1: "Eat traditional.",
            line2: "Live Better.",
            underlineText: "Live Better.",
            btn1Text: "Order Today!",
            btn1Page: "shop",
            btn1ExternalUrl: "",
            btn1_x: 40,
            btn1_y: 80,
            btn2Text: "Explore Bundles",
            btn2Page: "combos",
            btn2ExternalUrl: "",
            btn2_x: 60,
            btn2_y: 80
        };
    });

    const previewShelfRef = useRef<HTMLDivElement>(null);

    const handleSaveShelf = async () => {
        try {
            localStorage.setItem('hav_infinite_shelf_config', JSON.stringify(shelfConfig));
            window.dispatchEvent(new Event('storage'));

            // Sync to real DB for persistence across devices if column exists
            if (supabase && storeSettings) {
                await supabase.from('store_settings').update({
                    infinite_shelf_config: shelfConfig
                }).eq('id', 1);
            }

            alert("Infinite moving Shelf saved & deployed successfully!");
            fetchData();
        } catch (err: any) {
            console.error("Save Shelf Error:", err);
            alert("Saved locally! Keep in mind, you can run the SQL update below in Supabase for persistence database backups.");
        }
    };

    // Render underline dynamically
    const renderPreviewUnderline = (line: string) => {
        if (!line) return "";
        const uText = shelfConfig.underlineText;
        if (uText && line.toLowerCase().includes(uText.toLowerCase())) {
            const idx = line.toLowerCase().indexOf(uText.toLowerCase());
            const before = line.substring(0, idx);
            const match = line.substring(idx, idx + uText.length);
            const after = line.substring(idx + uText.length);
            return (
                <span>
                    {before}
                    <span className="italic text-hav-gold relative inline-block mx-1">
                        {match}
                        <svg className="absolute -bottom-1 left-0 w-full h-2 text-hav-gold/70" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 C 20 0, 40 10, 60 0, 80 10, 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </span>
                    {after}
                </span>
            );
        }
        return line;
    };

    const handleSaveGlobalBannerSettings = async () => {
        setSavingSettings(true);
        try {
            if (supabase && storeSettings) {
                const { error } = await supabase.from('store_settings').update({
                    is_banner_carousel_enabled: isBannerEnabled,
                    global_banner_duration: globalDuration
                }).eq('id', 1);
                
                if (error) {
                    console.warn("DB Column error, saving locally. Err:", error);
                }
            }
            // Save locally too for fallback
            localStorage.setItem('hav_is_banner_carousel_enabled', JSON.stringify(isBannerEnabled));
            localStorage.setItem('hav_global_banner_duration', String(globalDuration));
            window.dispatchEvent(new Event('storage'));
            
            alert("Global Carousel settings saved and deployed successfully!");
            fetchData();
        } catch (err: any) {
            console.error("Save Global Banner Settings error:", err);
            alert("Error saving settings.");
        } finally {
            setSavingSettings(false);
        }
    };

    // ----------------------------------------------------
    // TAB 2: HERO CAROUSEL BANNERS CONTROLS
    // ----------------------------------------------------
    const [selectedBanner, setSelectedBanner] = useState<PromotionalContent | null>(null);
    const [bannerForm, setBannerForm] = useState<any>({
        title: "",
        subtitle: "",
        text: "",
        image_url: "",
        is_active: true,
        sort_order: 1,
        overlay_opacity: 20,
        text_alignment: 'left',
        color_scheme: 'green',
        button_text: "",
        button_link_page: "",
        button_link_context: {
            custom_position: true,
            buttons: []
        },
        carousel_duration_seconds: 7
    });

    // Sync selected banner to form
    useEffect(() => {
        if (selectedBanner) {
            const ctx = selectedBanner.button_link_context || {};
            // Ensure compatibility (if legacy context without buttons list, fill in current text)
            let btnList = ctx.buttons || [];
            if (btnList.length === 0 && selectedBanner.button_text) {
                btnList = [{
                    id: 'btn1',
                    text: selectedBanner.button_text,
                    link_page: selectedBanner.button_link_page || 'shop',
                    link_path: '',
                    x: ctx.button_x !== undefined ? ctx.button_x : 50,
                    y: ctx.button_y !== undefined ? ctx.button_y : 80
                }];
            }

            setBannerForm({
                title: selectedBanner.title || "",
                subtitle: selectedBanner.subtitle || "",
                text: selectedBanner.text || "",
                image_url: selectedBanner.image_url || "",
                is_active: selectedBanner.is_active ?? true,
                sort_order: selectedBanner.sort_order || 1,
                overlay_opacity: ctx.overlay_opacity !== undefined ? ctx.overlay_opacity : 20,
                text_alignment: ctx.text_alignment || 'left',
                color_scheme: ctx.color_scheme || 'green',
                button_text: selectedBanner.button_text || "",
                button_link_page: selectedBanner.button_link_page || "",
                button_link_context: {
                    ...ctx,
                    custom_position: true,
                    buttons: btnList
                },
                carousel_duration_seconds: selectedBanner.carousel_duration_seconds || 7
            });
        } else {
            setBannerForm({
                title: "",
                subtitle: "",
                text: "",
                image_url: "",
                is_active: true,
                sort_order: 1,
                overlay_opacity: 20,
                text_alignment: 'left',
                color_scheme: 'green',
                button_text: "",
                button_link_page: "",
                button_link_context: {
                    custom_position: true,
                    buttons: []
                },
                carousel_duration_seconds: 7
            });
        }
    }, [selectedBanner]);

    const getDeviceLayoutKey = (device: 'widescreen' | 'desktop' | 'tablet' | 'mobile'): 'mobile' | 'tablet' | 'desktop' | 'widescreen' => {
        return device;
    };

    const getLayoutValue = (propName: string, defaultValue: any) => {
        const dev = getDeviceLayoutKey(fullscreenDevice);
        const layouts = bannerForm.button_link_context?.layouts || {};
        let activeLayout = layouts[dev] || {};
        if (dev === 'widescreen' && (!activeLayout || Object.keys(activeLayout).length === 0)) {
            activeLayout = layouts['desktop'] || {};
        }
        if (activeLayout[propName] !== undefined) {
            return activeLayout[propName];
        }
        if (bannerForm.button_link_context?.[propName] !== undefined) {
            return bannerForm.button_link_context[propName];
        }
        return defaultValue;
    };

    const getLayoutButtonCoordinates = (buttonId: string, defaultX: number, defaultY: number, defaultScale?: number) => {
        const dev = getDeviceLayoutKey(fullscreenDevice);
        const layouts = bannerForm.button_link_context?.layouts || {};
        let activeLayout = layouts[dev] || {};
        if (dev === 'widescreen' && (!activeLayout.buttons || activeLayout.buttons.length === 0)) {
            activeLayout = layouts['desktop'] || {};
        }
        const layoutBtns = activeLayout.buttons || [];
        const found = layoutBtns.find((b: any) => b.id === buttonId);
        
        const mainButtons = bannerForm.button_link_context?.buttons || [];
        const mainBtn = mainButtons.find((b: any) => b.id === buttonId) || {};

        const baseScale = mainBtn.scale !== undefined ? mainBtn.scale : (defaultScale ?? 100);
        const baseWidth = mainBtn.width;
        const baseHeight = mainBtn.height;

        if (found) {
            return {
                x: found.x !== undefined ? found.x : (mainBtn.x !== undefined ? mainBtn.x : defaultX),
                y: found.y !== undefined ? found.y : (mainBtn.y !== undefined ? mainBtn.y : defaultY),
                scale: found.scale !== undefined ? found.scale : (found.scale_factor !== undefined ? found.scale_factor : baseScale),
                bg_color: found.bg_color !== undefined ? found.bg_color : mainBtn.bg_color,
                text_color: found.text_color !== undefined ? found.text_color : mainBtn.text_color,
                px: found.px !== undefined ? found.px : mainBtn.px,
                py: found.py !== undefined ? found.py : mainBtn.py,
                width: found.width !== undefined ? found.width : baseWidth,
                height: found.height !== undefined ? found.height : baseHeight,
            };
        }

        const deviceScaleMultiplier = dev === 'mobile' ? 0.6 : dev === 'tablet' ? 0.8 : 1.0;

        return { 
            x: mainBtn.x !== undefined ? mainBtn.x : defaultX, 
            y: mainBtn.y !== undefined ? mainBtn.y : defaultY, 
            scale: Math.round(baseScale * deviceScaleMultiplier),
            bg_color: mainBtn.bg_color,
            text_color: mainBtn.text_color,
            px: mainBtn.px,
            py: mainBtn.py,
            width: baseWidth && baseWidth > 0 ? Math.round(baseWidth * deviceScaleMultiplier) : baseWidth,
            height: baseHeight && baseHeight > 0 ? Math.round(baseHeight * deviceScaleMultiplier) : baseHeight,
        };
    };

    const updateLayoutValue = (propName: string, value: any) => {
        const dev = getDeviceLayoutKey(fullscreenDevice);
        setBannerForm((prev: any) => {
            const ctx = prev.button_link_context || {};
            const layouts = ctx.layouts || {};
            const activeLayout = layouts[dev] || {};
            return {
                ...prev,
                button_link_context: {
                    ...ctx,
                    [propName]: value,
                    layouts: {
                        ...layouts,
                        [dev]: {
                            ...activeLayout,
                            [propName]: value
                        }
                    }
                }
            };
        });
    };

    const updateLayoutButtonValue = (buttonId: string, field: string, value: any) => {
        const dev = getDeviceLayoutKey(fullscreenDevice);
        setBannerForm((prev: any) => {
            const ctx = prev.button_link_context || {};
            const layouts = ctx.layouts || {};
            const activeLayout = layouts[dev] || {};
            
            const mainButtons = ctx.buttons || [];
            const isDeviceSpecificField = ['x', 'y', 'scale', 'width', 'height'].includes(field);

            const updatedMainButtons = mainButtons.map((b: any) => {
                if (b.id === buttonId) {
                    // Only update the default global properties if we are on desktop
                    // or if the field is a non-positioning property (like text, bg_color etc.)
                    if (dev === 'desktop' || !isDeviceSpecificField) {
                        return { ...b, [field]: value };
                    }
                }
                return b;
            });

            const layoutButtons = activeLayout.buttons || [];
            let updatedLayoutButtons = [...layoutButtons];
            const foundIdx = updatedLayoutButtons.findIndex((b: any) => b.id === buttonId);
            if (foundIdx > -1) {
                updatedLayoutButtons[foundIdx] = {
                    ...updatedLayoutButtons[foundIdx],
                    [field]: value
                };
            } else {
                const mainBtn = mainButtons.find((b: any) => b.id === buttonId);
                const seedBtn = { id: buttonId, x: 50, y: 80, scale: 100, ...mainBtn, [field]: value };
                updatedLayoutButtons.push(seedBtn);
            }

            return {
                ...prev,
                button_link_context: {
                    ...ctx,
                    buttons: updatedMainButtons,
                    layouts: {
                        ...layouts,
                        [dev]: {
                            ...activeLayout,
                            buttons: updatedLayoutButtons
                        }
                    }
                }
            };
        });
    };

    const previewBannerRef = useRef<HTMLDivElement>(null);
    const interactiveCanvasRef = useRef<HTMLDivElement>(null);

    const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

    // Image Upload helper
    const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, deviceType: string = 'desktop') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `site-assets/${fileName}`; 
            
            const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('media').getPublicUrl(filePath);
            if (deviceType === 'desktop') {
                setBannerForm((prev: any) => ({ ...prev, image_url: data.publicUrl }));
            } else {
                setBannerForm((prev: any) => ({
                    ...prev,
                    button_link_context: {
                        ...prev.button_link_context,
                        [`image_url_${deviceType}`]: data.publicUrl
                    }
                }));
            }
        } catch (err: any) {
            alert(`Upload failed: ${err.message || err}`);
        } finally {
            setUploading(false);
        }
    };

    // Add multiple buttons to slide
    const handleAddButton = () => {
        const newBtn = {
            id: `btn-${Date.now()}`,
            text: "Explore Now ➔",
            link_page: "shop",
            link_path: "",
            x: 50,
            y: 75
        };
        setBannerForm((prev: any) => {
            const currentButtons = prev.button_link_context?.buttons || [];
            return {
                ...prev,
                button_link_context: {
                    ...prev.button_link_context,
                    buttons: [...currentButtons, newBtn]
                }
            };
        });
    };

    const handleRemoveButton = (id: string) => {
        setBannerForm((prev: any) => {
            const currentButtons = prev.button_link_context?.buttons || [];
            return {
                ...prev,
                button_link_context: {
                    ...prev.button_link_context,
                    buttons: currentButtons.filter((b: any) => b.id !== id)
                }
            };
        });
    };

    const handleUpdateButton = (id: string, field: string, value: any) => {
        setBannerForm((prev: any) => {
            const currentButtons = prev.button_link_context?.buttons || [];
            return {
                ...prev,
                button_link_context: {
                    ...prev.button_link_context,
                    buttons: currentButtons.map((b: any) => b.id === id ? { ...b, [field]: value } : b)
                }
            };
        });
    };

    // Save Hero Banner to DB
    const handleSaveBannerForm = async () => {
        if (!bannerForm.image_url) {
            alert("Image URL is required for background display context.");
            return;
        }

        // Synchronize legacy button text with the first compositor button text (to support backward views)
        const primaryBtn = bannerForm.button_link_context?.buttons?.[0];
        const syncButtonText = primaryBtn ? primaryBtn.text : "";
        const syncButtonPage = primaryBtn ? primaryBtn.link_page : "";

        const payload: any = {
            type: 'image_carousel',
            title: bannerForm.title || null,
            subtitle: bannerForm.subtitle || null,
            text: bannerForm.text || null,
            image_url: bannerForm.image_url,
            is_active: bannerForm.is_active,
            sort_order: bannerForm.sort_order,
            carousel_duration_seconds: bannerForm.carousel_duration_seconds,
            button_text: syncButtonText || null,
            button_link_page: syncButtonPage || null,
            button_link_context: {
                ...bannerForm.button_link_context,
                text_alignment: bannerForm.text_alignment,
                color_scheme: bannerForm.color_scheme,
                overlay_opacity: bannerForm.overlay_opacity,
                button_x: primaryBtn ? primaryBtn.x : 50,
                button_y: primaryBtn ? primaryBtn.y : 80,
                custom_position: true
            }
        };

        const success = await onSavePromoContent(payload, selectedBanner?.id);
        if (success) {
            alert("Hero Banner successfully deployed!");
            setSelectedBanner(null);
            fetchData();
        } else {
            alert("Failed to save. Ensure columns and formats match.");
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this Hero Banner?")) {
            const success = await onDeletePromoContent(id);
            if (success) {
                setSelectedBanner(null);
                fetchData();
            }
        }
    };

    const activePreviewImageUrl = (() => {
        if (fullscreenDevice === 'mobile') {
            const spec = bannerForm.button_link_context?.[`image_url_mobile_${orientation}`];
            if (spec) return spec;
            const gen = bannerForm.button_link_context?.image_url_mobile;
            if (gen) return gen;
        } else if (fullscreenDevice === 'tablet') {
            const spec = bannerForm.button_link_context?.[`image_url_tablet_${orientation}`];
            if (spec) return spec;
            const gen = bannerForm.button_link_context?.image_url_tablet;
            if (gen) return gen;
        }
        return bannerForm.image_url || "";
    })() || bannerForm.image_url || "";

    const hideText = getLayoutValue('hide_text', false);

    return (
        <div className="space-y-6">
            
            {/* Centered branding header */}
            <div className="text-center max-w-3xl mx-auto space-y-3 pb-2 pt-4">
                <span className="text-[#C9A236] font-black uppercase text-[10px] tracking-widest bg-[#0A2E26]/5 px-3 py-1 rounded-full border border-hav-gold/20 inline-block">WYSIWYG Workspace</span>
                <h2 className="text-3xl md:text-4xl font-serif font-black text-hav-forest">Havikar Interactive Banners & Shelf Workstation</h2>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                    Compose typography overlays, drag buttons to direct paths, and control high resolution assets in real-time.
                </p>
            </div>

            {/* Mode Toggler in the middle of page with proper dark text */}
            <div className="flex justify-center my-6">
                <div className="flex bg-gray-150 p-1.5 rounded-full border border-gray-250 shadow-inner gap-1">
                    <button 
                        onClick={() => { setActiveTab('shelf'); setSelectedBanner(null); }}
                        className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'shelf' ? 'bg-[#C9A236] text-[#0A2E26] shadow-md' : 'text-[#0A2E26] hover:text-black hover:bg-white/60'}`}
                    >
                        Infinite Shelf 📦
                    </button>
                    <button 
                        onClick={() => setActiveTab('carousel')}
                        className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'carousel' ? 'bg-[#C9A236] text-[#0A2E26] shadow-md' : 'text-[#0A2E26] hover:text-[#0A2E26] hover:bg-white/60'}`}
                    >
                        Hero Banners 🎨
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: 1. INFINITE SHELF */}
            {activeTab === 'shelf' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
                    
                    {/* Enter Immersive Studio Alert banner */}
                    <div className="bg-gradient-to-r from-[#0F4A3C] via-[#0A2E26] to-[#051713] text-white rounded-3xl p-8 border border-hav-gold/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-left space-y-2">
                            <span className="text-[#C9A236] font-black uppercase text-[9px] tracking-widest bg-yellow-400/15 px-2.5 py-1 rounded-full border border-hav-gold/20 inline-block">WYSIWYG Workspace Editor</span>
                            <h3 className="text-xl md:text-2xl font-serif font-black text-[#FCF2D5]">WYSIWYG Immersive Editor</h3>
                            <p className="text-xs text-hav-cream/80 max-w-lg font-light leading-relaxed">
                                Need to preview your custom layouts on mobile, tablet, or desktop screen mockups? Enter the Immersive Studio to interactively drag CTA buttons with your cursor.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsFullscreen(true)}
                            className="w-full md:w-auto px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-yellow-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border-0"
                        >
                            <span>🖥️ Enter Immersive Studio</span>
                        </button>
                    </div>

                    {/* Properties Form (Now wider & perfectly aligned) */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-md space-y-6">
                        <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-serif font-black text-xl text-hav-forest">Shelf Properties</h3>
                                <p className="text-xs text-gray-400 font-light mt-0.5">Edit moving content titles, button highlights, and custom style target variables.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                <label className="text-xs font-bold text-gray-600">Active status:</label>
                                <input 
                                    type="checkbox" 
                                    checked={shelfConfig.isActive} 
                                    onChange={e => setShelfConfig({...shelfConfig, isActive: e.target.checked})} 
                                    className="w-5 h-5 accent-hav-forest cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wide text-[#C9A236] block mb-1">Heading Line 1</label>
                                    <input 
                                        type="text" 
                                        value={shelfConfig.line1} 
                                        onChange={e => setShelfConfig({...shelfConfig, line1: e.target.value})} 
                                        className={modalInputStyles}
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wide text-[#C9A236] block mb-1">Heading Line 2</label>
                                    <input 
                                        type="text" 
                                        value={shelfConfig.line2} 
                                        onChange={e => setShelfConfig({...shelfConfig, line2: e.target.value})} 
                                        className={modalInputStyles}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wide text-[#C9A236] block mb-1">Text Match to Highlight & Underline</label>
                                <input 
                                    type="text" 
                                    value={shelfConfig.underlineText} 
                                    placeholder="Enter exact words in Line 1 or Line 2"
                                    onChange={e => setShelfConfig({...shelfConfig, underlineText: e.target.value})} 
                                    className={modalInputStyles}
                                />
                                <span className="text-[10px] text-gray-400 mt-1.5 block">Renders a classic gold hand-drawn vector stroke underneath your matching word.</span>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Button 1 Composer */}
                                <div className="bg-hav-cream/20 p-5 rounded-2xl border border-hav-gold/10 space-y-4">
                                    <span className="text-[9px] font-bold text-hav-forest uppercase px-2.5 py-1 bg-hav-gold/20 rounded z-10 block w-max">Primary Button Config</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Button Text</label>
                                            <input type="text" value={shelfConfig.btn1Text} onChange={e => setShelfConfig({...shelfConfig, btn1Text: e.target.value})} className="border p-2.5 text-xs w-full rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Route Target</label>
                                            <select value={shelfConfig.btn1Page} onChange={e => setShelfConfig({...shelfConfig, btn1Page: e.target.value})} className="border p-2.5 text-xs w-full rounded-xl bg-white select-none">
                                                {PAGE_ROUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Background</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={shelfConfig.btn1BgColor || "#C9A236"} onChange={e => setShelfConfig({...shelfConfig, btn1BgColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                                                <input type="text" value={shelfConfig.btn1BgColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn1BgColor: e.target.value})} placeholder="#hex" className="border px-2 py-1.5 text-xs w-full rounded-lg" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Text Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={shelfConfig.btn1TextColor || "#0F4A3C"} onChange={e => setShelfConfig({...shelfConfig, btn1TextColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                                                <input type="text" value={shelfConfig.btn1TextColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn1TextColor: e.target.value})} placeholder="#hex" className="border px-2 py-1.5 text-xs w-full rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Border Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={shelfConfig.btn1BorderColor || "#ffffff"} onChange={e => setShelfConfig({...shelfConfig, btn1BorderColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                                                <input type="text" value={shelfConfig.btn1BorderColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn1BorderColor: e.target.value})} placeholder="None/hex" className="border px-2 py-1.5 text-xs w-full rounded-lg" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Corner Style</label>
                                            <select value={shelfConfig.btn1BorderRadius || "pill"} onChange={e => setShelfConfig({...shelfConfig, btn1BorderRadius: e.target.value})} className="border p-2.5 text-xs w-full rounded-xl bg-white select-none">
                                                <option value="sharp">Sharp Corner</option>
                                                <option value="rounded-sm">Subtle Soft</option>
                                                <option value="rounded">Rounded Box</option>
                                                <option value="rounded-xl">Highly Rounded</option>
                                                <option value="pill">Pill Shape</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold block mb-1">Horizontal Location (X): {shelfConfig.btn1_x ?? 40}%</label>
                                        <input type="range" min="0" max="100" value={shelfConfig.btn1_x ?? 40} onChange={e => setShelfConfig({...shelfConfig, btn1_x: Number(e.target.value)})} className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-hav-gold" />
                                    </div>
                                </div>

                                {/* Button 2 Composer */}
                                <div className="bg-hav-cream/20 p-5 rounded-2xl border border-hav-gold/10 space-y-4">
                                    <span className="text-[9px] font-bold text-hav-forest uppercase px-2.5 py-1 bg-hav-gold/20 rounded z-10 block w-max">Secondary Button Config</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Button Text</label>
                                            <input type="text" value={shelfConfig.btn2Text} onChange={e => setShelfConfig({...shelfConfig, btn2Text: e.target.value})} className="border p-2.5 text-xs w-full rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Route Target</label>
                                            <select value={shelfConfig.btn2Page} onChange={e => setShelfConfig({...shelfConfig, btn2Page: e.target.value})} className="border p-2.5 text-xs w-full rounded-xl bg-white select-none">
                                                {PAGE_ROUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Background</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={shelfConfig.btn2BgColor || "#000000"} onChange={e => setShelfConfig({...shelfConfig, btn2BgColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                                                <input type="text" value={shelfConfig.btn2BgColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn2BgColor: e.target.value})} placeholder="#hex" className="border px-2 py-1.5 text-xs w-full rounded-lg" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Text Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={shelfConfig.btn2TextColor || "#C9A236"} onChange={e => setShelfConfig({...shelfConfig, btn2TextColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                                                <input type="text" value={shelfConfig.btn2TextColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn2TextColor: e.target.value})} placeholder="#hex" className="border px-2 py-1.5 text-xs w-full rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Border Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={shelfConfig.btn2BorderColor || "#C9A236"} onChange={e => setShelfConfig({...shelfConfig, btn2BorderColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                                                <input type="text" value={shelfConfig.btn2BorderColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn2BorderColor: e.target.value})} placeholder="None/hex" className="border px-2 py-1.5 text-xs w-full rounded-lg" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-1">Corner Style</label>
                                            <select value={shelfConfig.btn2BorderRadius || "pill"} onChange={e => setShelfConfig({...shelfConfig, btn2BorderRadius: e.target.value})} className="border p-2.5 text-xs w-full rounded-xl bg-white select-none">
                                                <option value="sharp">Sharp Corner</option>
                                                <option value="rounded-sm">Subtle Soft</option>
                                                <option value="rounded">Rounded Box</option>
                                                <option value="rounded-xl">Highly Rounded</option>
                                                <option value="pill">Pill Shape</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold block mb-1">Horizontal Location (X): {shelfConfig.btn2_x ?? 60}%</label>
                                        <input type="range" min="0" max="100" value={shelfConfig.btn2_x ?? 60} onChange={e => setShelfConfig({...shelfConfig, btn2_x: Number(e.target.value)})} className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-hav-gold" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button onClick={handleSaveShelf} className={`${primaryButtonStyles} w-full py-4 text-sm font-extrabold uppercase tracking-wider shadow-md hover:scale-[1.01] transition-transform`}>
                                Save & Deploy Moving Shelf 📦
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* TAB CONTENT: 2. HERO CAROUSEL BANNERS */}
            {activeTab === 'carousel' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Banners List / Grid Header */}
                    {!selectedBanner ? (
                        <div className="space-y-6">
                            {/* Enter Immersive Studio Alert banner for Hero Banners */}
                            <div className="bg-gradient-to-r from-[#0F4A3C] via-[#0A2E26] to-[#051713] text-white rounded-3xl p-8 border border-hav-gold/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                                <div className="text-left space-y-2">
                                    <span className="text-[#C9A236] font-black uppercase text-[9px] tracking-widest bg-yellow-400/15 px-2.5 py-1 rounded-full border border-hav-gold/20 inline-block">Visual Slide Compositor</span>
                                    <h3 className="text-xl md:text-2xl font-serif font-black text-[#FCF2D5]">Hero Banner Immersive Studio</h3>
                                    <p className="text-xs text-hav-cream/80 max-w-lg font-light leading-relaxed font-sans">
                                        Open the immersive fullscreen workstation to visually drag-and-drop buttons, configure layouts, mount real-time showcase badges, and preview on mobile, tablet, or desktop mockups.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const targetBanner = carouselBanners[0] || ({} as any);
                                        setSelectedBanner(targetBanner);
                                        setIsFullscreen(true);
                                    }}
                                    className="w-full md:w-auto px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-yellow-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border-0"
                                >
                                    <span>🖥️ Enter Immersive Studio</span>
                                </button>
                            </div>

                            {/* Global Master Carousel Settings Card */}
                            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                                <h4 className="text-md font-serif font-black text-hav-forest mb-4 flex items-center gap-2">
                                    ⚙️ Master Carousel & Banner Controls
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    {/* Enable / Disable banner */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-gray-700 block">Master Main Switch</span>
                                        <label className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={isBannerEnabled} 
                                                onChange={e => setIsBannerEnabled(e.target.checked)}
                                                className="w-5 h-5 accent-hav-forest cursor-pointer rounded" 
                                            />
                                            <div className="text-left">
                                                <span className="text-xs font-black block text-gray-900">Show Hero Banner Carousel</span>
                                                <span className="text-[10px] text-gray-500 block">Uncheck this to completely remove/hide the carousel section from the home page.</span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Duration set */}
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-[#0F4A3C] block">
                                            Global Default Slide Interval (seconds)
                                        </span>
                                        <div className="flex gap-3">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="60" 
                                                value={globalDuration} 
                                                onChange={e => setGlobalDuration(Math.max(1, Number(e.target.value)))} 
                                                className="w-full max-w-[120px] rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm outline-none focus:ring-hav-gold focus:ring-2 focus:border-hav-gold" 
                                            />
                                            <button 
                                                onClick={handleSaveGlobalBannerSettings}
                                                disabled={savingSettings}
                                                className="px-6 py-2.5 bg-hav-forest text-hav-gold hover:bg-hav-forest/90 font-bold text-xs rounded-xl transition-all uppercase tracking-wider block shrink-0 cursor-pointer"
                                            >
                                                {savingSettings ? "Saving..." : "Apply"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center sm:pb-2">
                                <h3 className="text-xl font-serif font-black text-hav-forest">Deployed Active Carousels ({carouselBanners.length})</h3>
                                <button 
                                    onClick={() => setSelectedBanner({} as any)}
                                    className={primaryButtonStyles}
                                >
                                    + Create Hero Banner
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {carouselBanners.map(banner => (
                                    <div key={banner.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                        <div className="w-full aspect-[16/10] bg-hav-forest relative flex items-center justify-center overflow-hidden">
                                            {banner.image_url ? (
                                                <img src={banner.image_url} alt={banner.title || ''} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                            ) : (
                                                <div className="text-white/40 text-xs">No background media image</div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                            <div className="absolute bottom-4 left-4 right-4 text-left">
                                                <span className="text-[8px] bg-hav-gold text-hav-forest px-2 py-0.5 rounded-full font-black uppercase mb-1 inline-block">Order # {banner.sort_order}</span>
                                                <h4 className="text-white font-serif font-bold text-sm tracking-tight line-clamp-1">{banner.title || 'Untitled Banner'}</h4>
                                                <p className="text-white/70 text-[9px] line-clamp-1 font-light">{banner.subtitle || 'No subtitle description.'}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col gap-2 w-full mt-auto border-t border-gray-100">
                                            <div className="flex gap-1.5 w-full">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedBanner(banner);
                                                        setIsFullscreen(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[9px] uppercase tracking-wider rounded-xl shadow-xs transition-all text-center whitespace-nowrap"
                                                >
                                                    🖥️ Fullscreen Studio
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedBanner(banner)}
                                                    className="px-2.5 py-2 bg-hav-cream hover:bg-hav-gold/25 text-hav-forest font-bold text-[9px] uppercase rounded-xl border border-hav-gold/20 transition-all text-center whitespace-nowrap"
                                                >
                                                    Inline Edit 🛠️
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteBanner(banner.id)}
                                                    className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all flex items-center justify-center"
                                                    aria-label="Delete banner"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Individual Banner Editor View with adjustable Wide layout support */
                        <div className="space-y-4">
                            {/* Layout Workspace Switcher Bar */}
                            <div className="bg-hav-cream/50 p-3 rounded-2xl border border-hav-gold/15 flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-hav-forest">🖥️ Workspace Width:</span>
                                    <div className="flex bg-white shadow-xs rounded-full p-0.5 border border-gray-200">
                                        <button 
                                            type="button"
                                            onClick={() => setIsWideWorkspace(false)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${!isWideWorkspace ? 'bg-hav-forest text-hav-gold' : 'text-gray-500 hover:text-black'}`}
                                        >
                                            Split Pane
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setIsWideWorkspace(true)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${isWideWorkspace ? 'bg-hav-forest text-hav-gold' : 'text-gray-500 hover:text-black'}`}
                                        >
                                            Full Wide Sandbox
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">🎯 Slide Switcher:</span>
                                    <select 
                                        value={selectedBanner?.id || ""} 
                                        onChange={e => {
                                            const found = carouselBanners.find(b => b.id === e.target.value);
                                            if (found) setSelectedBanner(found);
                                        }}
                                        className="border py-1 px-3 rounded-xl bg-white focus:border-hav-gold outline-none text-xs"
                                    >
                                        {carouselBanners.map(b => (
                                            <option key={b.id} value={b.id}>{b.title || "Untitled Carousel Slide"}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 ${isWideWorkspace ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8 items-start`}>
                                
                                {/* Editor Form Columns */}
                                <div className={`${isWideWorkspace ? 'w-full' : 'lg:col-span-5'} bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar`}>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <h3 className="font-serif font-black text-lg text-hav-forest">{selectedBanner.id ? 'Modify Banner Slide' : 'Design New Banner Slide'}</h3>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => setIsFullscreen(true)}
                                                className="text-[10px] bg-hav-gold/20 text-[#0F4A3C] hover:bg-hav-gold/45 px-2.5 py-1 rounded-lg font-black transition-all"
                                            >
                                                🖥️ Open Fullscreen Sandbox
                                            </button>
                                            <button type="button" onClick={() => setSelectedBanner(null)} className="text-xs text-gray-500 hover:text-black hover:font-bold">➔ Back</button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Connect Product segment */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Connect Product (Optional)</label>
                                            <div className="space-y-2">
                                                <select 
                                                    value={bannerForm.button_link_context?.product_id || ""} 
                                                    onChange={e => {
                                                        const pId = e.target.value;
                                                        const chosenProduct = products.find(p => p.id === pId);
                                                        if (chosenProduct) {
                                                            const img = chosenProduct.image_urls?.[0] || "";
                                                            setBannerForm(prev => ({
                                                                ...prev,
                                                                title: prev.title || chosenProduct.name,
                                                                subtitle: prev.subtitle || chosenProduct.tagline || chosenProduct.description || "",
                                                                image_url: img || prev.image_url,
                                                                button_link_page: 'product',
                                                                button_link_context: {
                                                                    ...prev.button_link_context,
                                                                    product_id: pId,
                                                                    show_product_badge: prev.button_link_context?.show_product_badge ?? true,
                                                                    buttons: prev.button_link_context?.buttons && prev.button_link_context?.buttons.length > 0 ? prev.button_link_context.buttons : [
                                                                        {
                                                                            id: 'btn-prod-1',
                                                                            text: `Buy ${chosenProduct.name} ➔`,
                                                                            link_page: 'product',
                                                                            link_path: pId,
                                                                            x: 50,
                                                                            y: 75
                                                                        }
                                                                    ]
                                                                }
                                                            }));
                                                        } else {
                                                            setBannerForm(prev => ({
                                                                ...prev,
                                                                button_link_context: {
                                                                    ...prev.button_link_context,
                                                                    product_id: "",
                                                                    show_product_badge: false
                                                                }
                                                            }));
                                                        }
                                                    }} 
                                                    className={modalInputStyles}
                                                >
                                                    <option value="">-- Connect an active storefront product --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Price: ₹{p.product_variants?.[0]?.price || 'N/A'})</option>
                                                    ))}
                                                </select>
                                                
                                                {bannerForm.button_link_context?.product_id && (
                                                    <div className="flex items-center justify-between bg-hav-cream/30 p-2.5 rounded-xl border border-hav-gold/10">
                                                        <span className="text-[10px] text-gray-600 font-bold">Display Interactive Product Overlay Badge</span>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!bannerForm.button_link_context?.show_product_badge} 
                                                            onChange={e => setBannerForm({
                                                                ...bannerForm,
                                                                button_link_context: {
                                                                    ...bannerForm.button_link_context,
                                                                    show_product_badge: e.target.checked
                                                                }
                                                            })} 
                                                            className="w-4 h-4 accent-hav-gold cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Sort Order</label>
                                                <input type="number" value={bannerForm.sort_order} onChange={e => setBannerForm({...bannerForm, sort_order: Number(e.target.value)})} className={modalInputStyles} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Duration (secs)</label>
                                                <input type="number" value={bannerForm.carousel_duration_seconds} onChange={e => setBannerForm({...bannerForm, carousel_duration_seconds: Number(e.target.value)})} className={modalInputStyles} />
                                            </div>
                                        </div>

                                        {/* Deploy Active toggle status */}
                                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <div className="text-left">
                                                <label className="text-xs font-bold text-gray-700 block">Deploy Status</label>
                                                <span className="text-[10px] text-gray-400 font-light block leading-tight mt-0.5">Publish and show this slide live on storefront home-carousel</span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={bannerForm.is_active} 
                                                onChange={e => setBannerForm({...bannerForm, is_active: e.target.checked})} 
                                                className="w-5 h-5 accent-[#C9A236] cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Slide Main Heading (Title)</label>
                                            <input type="text" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className={modalInputStyles} />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Slide Subtitle / Subtext</label>
                                            <textarea value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} rows={2} className={`${modalInputStyles} resize-none`} />
                                        </div>

                                        {/* Upload Asset Segment */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-hav-gold block">Banner Background Image (PNG/JPG)</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={bannerForm.image_url} onChange={e => setBannerForm({...bannerForm, image_url: e.target.value})} placeholder="Paste existing public image address or choose file" className={modalInputStyles} />
                                            
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    id="file-banner-upload" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={e => handleBannerImageUpload(e, 'desktop')} 
                                                    disabled={uploading} 
                                                />
                                                <label 
                                                    htmlFor="file-banner-upload" 
                                                    className="px-4 py-3 bg-hav-forest text-hav-gold border border-hav-gold/20 hover:bg-hav-forest/95 rounded-xl cursor-pointer text-xs font-bold block whitespace-nowrap shadow active:scale-95 transition-all text-center"
                                                >
                                                    {uploading ? '...' : 'Upload'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Overlay Contrast Opacity: {bannerForm.overlay_opacity}%</label>
                                            <input type="range" min="0" max="75" value={bannerForm.overlay_opacity} onChange={e => setBannerForm({...bannerForm, overlay_opacity: Number(e.target.value)})} className="w-full bg-gray-200 rounded cursor-pointer accent-hav-gold" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Text Block Alignment</label>
                                            <select value={bannerForm.text_alignment} onChange={e => setBannerForm({...bannerForm, text_alignment: e.target.value})} className={modalInputStyles}>
                                                <option value="left">Left Aligned</option>
                                                <option value="center">Centered</option>
                                                <option value="right">Right Aligned</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dynamic Multi-Buttons Composer */}
                                    <div className="p-4 bg-hav-cream/30 rounded-2xl border border-hav-gold/10 space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase text-hav-forest tracking-wide">Interactive Call-To-Action (CTA) & Hotspots ({bannerForm.button_link_context?.buttons?.length || 0})</span>
                                            <div className="flex gap-2 flex-wrap">
                                                <button 
                                                    type="button" 
                                                    onClick={handleAddButton} 
                                                    className="text-[9px] bg-hav-forest hover:bg-hav-forest/90 text-hav-gold font-bold px-3 py-1 rounded-lg border border-hav-gold/20"
                                                    title="Add standard styled button onto the slide"
                                                >
                                                    + Standard Button
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setIsDrawingMode(true);
                                                        alert("📐 Drawing mode activated!\n\nJust click/touch and draw a box directly on the visual slide background image frame on the right side to add your hotspot.");
                                                    }} 
                                                    className={`text-[9px] font-bold px-3 py-1 rounded-lg border transition-all ${isDrawingMode ? 'bg-[#C9A236] text-black border-white/40 animate-pulse' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-350'}`}
                                                    title="Draw an invisible click hotspot directly on the frame"
                                                >
                                                    {isDrawingMode ? "📐 Drawing Area..." : "🔲 Draw Hotspot"}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setBannerForm((prev: any) => ({
                                                            ...prev,
                                                            button_link_context: {
                                                                ...prev.button_link_context,
                                                                clickable_slide: !prev.button_link_context?.clickable_slide
                                                            }
                                                        }));
                                                    }} 
                                                    className={`text-[9px] font-bold px-3 py-1 rounded-lg border transition-all ${bannerForm.button_link_context?.clickable_slide ? 'bg-[#DFCFAF] text-[#0A2922] border-[#C9A236]' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-350'}`}
                                                    title="Allow clicking anywhere on the background image to redirect"
                                                >
                                                    🔗 Clickable slide background: {bannerForm.button_link_context?.clickable_slide ? "ON" : "OFF"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-[30vh] overflow-y-auto custom-scrollbar">
                                            {(bannerForm.button_link_context?.buttons || []).map((btn: any, idx: number) => (
                                                <div key={btn.id} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2.5 relative">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveButton(btn.id)} 
                                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-black p-0.5 whitespace-nowrap"
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                    <span className="text-[9px] bg-hav-gold/20 text-hav-forest font-bold px-2 py-0.5 rounded-full">Button #{idx + 1}</span>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label id="btn-lbl-field" className="text-[8px] text-gray-500 font-bold block">Button Label Customizer</label>
                                                            <input type="text" value={btn.text} onChange={e => handleUpdateButton(btn.id, 'text', e.target.value)} className="w-full border p-1 rounded text-xs outline-none focus:border-hav-gold" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] text-gray-500 font-bold block">Redirect Route</label>
                                                            <select value={btn.link_page} onChange={e => handleUpdateButton(btn.id, 'link_page', e.target.value)} className="w-full border p-1 rounded text-xs outline-none focus:border-hav-gold bg-white">
                                                                {PAGE_ROUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}<option value="product">Single Specific Product</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {btn.link_page === 'product' && (
                                                        <div className="text-black space-y-1 bg-gray-50 p-2 rounded border border-gray-100 my-1 text-xs">
                                                            <label className="text-[8px] text-gray-500 block font-bold">Target Product Destination</label>
                                                            <select 
                                                                value={btn.context?.productId || ""} 
                                                                onChange={e => handleUpdateButton(btn.id, 'context', { ...btn.context, productId: e.target.value })}
                                                                className="w-full border border-gray-200 p-1 rounded text-xs bg-white outline-none"
                                                            >
                                                                <option value="">-- Select Product --</option>
                                                                {products.map((p: any) => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {btn.link_page === 'shop' && (
                                                        <div className="text-black space-y-1 bg-gray-50 p-2 rounded border border-gray-100 my-1 text-xs">
                                                            <label className="text-[8px] text-gray-500 block font-bold font-sans uppercase">Target Category Filter</label>
                                                            <select 
                                                                value={btn.context?.category || ""} 
                                                                onChange={e => handleUpdateButton(btn.id, 'context', { ...btn.context, category: e.target.value })}
                                                                className="w-full border border-gray-200 p-1 rounded text-xs bg-white outline-none"
                                                            >
                                                                <option value="">-- All Products (No Filter) --</option>
                                                                {categories.map((c: any) => (
                                                                     <option key={c.id} value={c.name}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="grid grid-cols-2 gap-2 text-black">
                                                        <div>
                                                            <label className="text-[8px] text-gray-500 font-bold block">Background Color</label>
                                                            <div className="flex gap-1 items-center">
                                                                <input type="color" value={btn.bg_color || "#FCF2D5"} onChange={e => handleUpdateButton(btn.id, 'bg_color', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
                                                                <input type="text" value={btn.bg_color || ""} onChange={e => handleUpdateButton(btn.id, 'bg_color', e.target.value)} placeholder="#hex" className="border px-1 leading-tight text-[8px] w-full rounded text-black" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] text-gray-500 font-bold block">Text Color</label>
                                                            <div className="flex gap-1 items-center">
                                                                <input type="color" value={btn.text_color || "#0F4A3C"} onChange={e => handleUpdateButton(btn.id, 'text_color', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
                                                                <input type="text" value={btn.text_color || ""} onChange={e => handleUpdateButton(btn.id, 'text_color', e.target.value)} placeholder="#hex" className="border px-1 leading-tight text-[8px] w-full rounded text-black" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-black">
                                                        <div>
                                                            <label className="text-[8px] text-gray-500 font-bold block">Border Color</label>
                                                            <div className="flex gap-1 items-center">
                                                                <input type="color" value={btn.border_color || "#fcf2d5"} onChange={e => handleUpdateButton(btn.id, 'border_color', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
                                                                <input type="text" value={btn.border_color || ""} onChange={e => handleUpdateButton(btn.id, 'border_color', e.target.value)} placeholder="None" className="border px-1 leading-tight text-[8px] w-full rounded text-black" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] text-gray-500 font-bold block">Corner Shape</label>
                                                            <select value={btn.border_radius || "pill"} onChange={e => handleUpdateButton(btn.id, 'border_radius', e.target.value)} className="border p-0.5 text-[8px] w-full rounded bg-white text-black">
                                                                <option value="sharp">Sharp</option>
                                                                <option value="rounded-sm">Subtle Soft</option>
                                                                <option value="rounded">Rounded Box</option>
                                                                <option value="rounded-xl">Highly Rounded</option>
                                                                <option value="pill">Pill Shape</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[8px] text-gray-400 block">X Coords: {btn.x}%</label>
                                                            <input type="range" min="0" max="100" value={btn.x} onChange={e => handleUpdateButton(btn.id, 'x', Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded cursor-pointer accent-hav-gold" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] text-gray-400 block">Y Coords: {btn.y}%</label>
                                                            <input type="range" min="0" max="100" value={btn.y} onChange={e => handleUpdateButton(btn.id, 'y', Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded cursor-pointer accent-hav-gold" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(bannerForm.button_link_context?.buttons || []).length === 0 && (
                                                <span className="text-[10px] text-gray-400 block text-center py-2 italic font-light">• No CTA buttons added yet. Click "+ Add Button" above.</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                </div>

                                <div className="pt-2 flex gap-3">
                                    {selectedBanner?.id && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleDeleteBanner(selectedBanner.id)} 
                                            className="px-4 py-2 bg-red-100 hover:bg-red-255 text-red-700 hover:text-red-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all font-sans whitespace-nowrap"
                                            title="Delete Banner"
                                        >
                                            🗑️ Delete
                                        </button>
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedBanner(null)} 
                                        className={`${secondaryButtonStyles} flex-1`}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleSaveBannerForm} 
                                        className={`${primaryButtonStyles} flex-1`}
                                    >
                                        Save & Deploy Banner
                                    </button>
                                </div>
                            </div>

                            {/* Live Sandbox Canvas (Reposition drag-and-drop frame) */}
                            <div className={`${isWideWorkspace ? 'w-full' : 'lg:col-span-7'} space-y-4`}>
                                <div className="bg-white p-4 rounded-t-3xl border-t border-x border-gray-200 flex justify-between items-center">
                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-hav-gold block">Visual WYSIWYG Sandbox</span>
                                        <h4 className="text-base font-serif font-black text-gray-800">Dynamic Hero Banner WYSIWYG Compositor</h4>
                                    </div>
                                    {isWideWorkspace && (
                                        <span className="text-[9px] bg-hav-gold/15 text-hav-forest border border-hav-gold/30 px-2.5 py-1 rounded-full font-black uppercase">
                                            Widescreen Banner mode active
                                        </span>
                                    )}
                                </div>

                                <div 
                                    ref={previewBannerRef}
                                    className={`relative w-full ${isWideWorkspace ? 'aspect-[21/9] md:aspect-[21/7]' : 'aspect-[16/10]'} rounded-b-3xl bg-hav-forest text-white overflow-hidden shadow-inner border border-gray-300 flex flex-col items-center justify-center p-6 select-none bg-cover bg-center transition-all`} 
                                    style={{ backgroundImage: bannerForm.image_url ? `url(${bannerForm.image_url})` : 'none' }}
                                >
                                    {/* Overlay intensity contrast */}
                                    <div className="absolute inset-0 bg-black" style={{ opacity: bannerForm.overlay_opacity / 100 }}></div>

                                    {/* Overlay text block based on text_alignment style */}
                                    <div className={`absolute z-10 p-6 md:p-8 max-w-lg w-full flex flex-col ${
                                        bannerForm.text_alignment === 'center' ? 'items-center text-center' :
                                        bannerForm.text_alignment === 'right' ? 'items-end text-right justify-end ml-auto' :
                                        'items-start text-left mr-auto'
                                    }`}>
                                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-black text-hav-gold drop-shadow-md leading-tight mb-2">
                                            {bannerForm.title || "Composed Premium Taste Title"}
                                        </h2>
                                        <p className="text-[10px] md:text-xs text-white/90 leading-relaxed font-light drop-shadow shadow-black">
                                            {bannerForm.subtitle || "Composition of custom subtext representing real products loaded beautifully on home page."}
                                        </p>
                                    </div>

                                    {/* Draggable Buttons in composer frame */}
                                    {(bannerForm.button_link_context?.buttons || []).map((btn: any) => (
                                        <motion.div
                                            key={btn.id}
                                            drag
                                            dragMomentum={false}
                                            dragElastic={0}
                                            onDrag={(event, info) => {
                                                if (previewBannerRef.current) {
                                                    const rect = previewBannerRef.current.getBoundingClientRect();
                                                    const xPercent = ((info.point.x - rect.left) / rect.width) * 100;
                                                    const yPercent = ((info.point.y - rect.top) / rect.height) * 100;
                                                    const boundedX = Math.round(Math.min(Math.max(xPercent, 2), 98));
                                                    const boundedY = Math.round(Math.min(Math.max(yPercent, 2), 98));
                                                    handleUpdateButton(btn.id, 'x', boundedX);
                                                    handleUpdateButton(btn.id, 'y', boundedY);
                                                }
                                            }}
                                            className="absolute cursor-move active:cursor-grabbing z-30 select-none pb-1.5"
                                            style={{
                                                left: `${btn.x ?? 50}%`,
                                                top: `${btn.y ?? 75}%`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <div 
                                                className="px-3 py-1.5 font-black uppercase text-[8px] tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none flex items-center gap-1 whitespace-nowrap transition-all duration-200"
                                                style={{
                                                    backgroundColor: btn.bg_color || '#C9A236',
                                                    color: btn.text_color || '#0F4A3C',
                                                    borderColor: btn.border_color || 'transparent',
                                                    borderWidth: btn.border_color ? '2px' : '0px',
                                                    borderRadius: btn.border_radius === 'sharp' ? '0px' :
                                                                  btn.border_radius === 'rounded-sm' ? '4px' :
                                                                  btn.border_radius === 'rounded' ? '8px' :
                                                                  btn.border_radius === 'rounded-xl' ? '14px' : '9999px'
                                                }}
                                            >
                                                <span>🎯 {btn.text}</span>
                                                <span className="text-[6px] opacity-60 bg-current text-white px-1 py-0.5 rounded font-sans font-bold mix-blend-difference">DRAG</span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Connected Product Preview Overlay badge */}
                                    {bannerForm.button_link_context?.product_id && bannerForm.button_link_context?.show_product_badge && (() => {
                                        const pId = bannerForm.button_link_context.product_id;
                                        const p = products.find(prod => prod.id === pId);
                                        if (!p) return null;
                                        return (
                                            <div className="absolute bottom-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-hav-gold/25 p-3 shadow-2xl max-w-[200px] text-gray-900 flex items-center gap-2 select-none animate-fade-in">
                                                <img 
                                                    src={p.image_urls?.[0]} 
                                                    alt={p.name} 
                                                    className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0" 
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="flex-1 text-left min-w-0">
                                                    <h4 className="font-serif font-black text-[9px] text-hav-forest truncate leading-tight">
                                                        {p.name}
                                                    </h4>
                                                    <div className="flex items-center justify-between gap-1 mt-1">
                                                        <span className="text-[9px] font-black text-hav-forest">
                                                            ₹{p.product_variants?.[0]?.price || 350}
                                                        </span>
                                                        <span className="bg-hav-gold/15 text-hav-forest font-black text-[7px] px-1.5 py-0.5 rounded uppercase">
                                                            Linked
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Composite Instruction alerts */}
                                <div className="p-5 bg-white border rounded-2xl text-[11px] text-gray-500 leading-relaxed space-y-1.5 text-left shadow-xs">
                                    <h5 className="font-bold text-hav-forest uppercase tracking-wider text-[10px]">✨ Visual Sandbox Controls:</h5>
                                    <p>• Click <b>"+ Add Button"</b>, configure its destination links/labels, and then **DRAG it directly on the visual slide background image preview frame above** to position it! X & Y offsets synchronize live in the forms.</p>
                                    <p>• When deploying, our renderer maps each custom button to precise overlays on high priority storefront view screens.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                </div>
            )}

            {/* DATABASE SQL SCRIPT CONTAINER */}
            <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-hav-gold text-hav-forest text-[8px] font-black px-2 py-0.5 rounded uppercase font-mono">SUPABASE COMPLIANT SQL RULES</span>
                    <h4 className="font-serif font-black text-gray-800 text-sm">Supabase Database Struct Schema Update</h4>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed max-w-3xl">
                    To enable cross-device synchronization and durable backups for your custom <b>Infinite moving Shelf</b> configurations inside your database, simply run this query directly inside your Supabase SQL Editor. There are no placeholder strings which would fail UUID typing!
                </p>

                <div className="bg-gray-900 rounded-2xl p-4 text-left font-mono text-[10px] text-green-400 overflow-x-auto relative">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(`ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS infinite_shelf_config JSONB DEFAULT '{
  "isActive": true,
  "line1": "Eat traditional.",
  "line2": "Live Better.",
  "underlineText": "Live Better.",
  "btn1Text": "Order Today!",
  "btn1Page": "shop",
  "btn1ExternalUrl": "",
  "btn1_x": 40,
  "btn1_y": 80,
  "btn2Text": "Explore Bundles",
  "btn2Page": "combos",
  "btn2ExternalUrl": "",
  "btn2_x": 60,
  "btn2_y": 80
}';`);
                            alert("Copied custom SQL to clipboard smoothly!");
                        }}
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md px-2 py-1 text-[9px] font-sans"
                    >
                        Copy SQL
                    </button>
                    {`-- Setup Infinite moving Shelf settings column dynamically
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS infinite_shelf_config JSONB DEFAULT '{
  "isActive": true,
  "line1": "Eat traditional.",
  "line2": "Live Better.",
  "underlineText": "Live Better.",
  "btn1Text": "Order Today!",
  "btn1Page": "shop",
  "btn1ExternalUrl": "",
  "btn1_x": 40,
  "btn1_y": 80,
  "btn2Text": "Explore Bundles",
  "btn2Page": "combos",
  "btn2ExternalUrl": "",
  "btn2_x": 60,
  "btn2_y": 80
}';`}
                </div>
            </div>

            {isFullscreen && (
                <div className="fixed inset-0 z-[9999] bg-[#0A2E26] text-white flex flex-col md:flex-row overflow-y-auto md:overflow-hidden h-full md:h-screen w-screen animate-fade-in font-sans">
                    {/* LEFT PANEL */}
                    <div className="w-full md:w-[420px] bg-[#0A2922] border-b md:border-b-0 md:border-r border-[#DFCFAF]/15 flex flex-col h-auto md:h-full overflow-visible md:overflow-hidden shrink-0">
                        {/* Header */}
                        <div className="p-5 border-b border-[#DFCFAF]/15 flex justify-between items-center bg-[#07211B]">
                            <div>
                                <span className="text-[9px] bg-[#C9A236]/20 text-[#DFCFAF] font-black uppercase tracking-wider px-2 py-0.5 rounded">Studio Workstation</span>
                                <h3 className="font-serif font-black text-lg text-[#C9A236] mt-1">Immersive Sandbox</h3>
                            </div>
                            <button 
                                onClick={() => setIsFullscreen(false)}
                                className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-100 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5"
                            >
                                ✕ Exit Studio
                            </button>
                        </div>

                        {/* Immersive Tab Switcher */}
                        <div className="px-5 py-3 bg-[#051C17] border-b border-[#DFCFAF]/10 flex gap-2">
                            <button 
                                onClick={() => { setActiveTab('shelf'); setSelectedBanner(null); }}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'shelf' ? 'bg-[#C9A236] text-[#0A2E26] shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'}`}
                            >
                                📦 Infinite Shelf
                            </button>
                            <button 
                                onClick={() => setActiveTab('carousel')}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'carousel' ? 'bg-[#C9A236] text-[#0A2E26] shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'}`}
                            >
                                🎨 Hero Carousels
                            </button>
                        </div>

                        {/* Middle Settings Block */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 text-white">
                            {activeTab === 'shelf' ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                        <span className="text-xs font-bold text-[#DFCFAF]">Infinite Shelf status:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-300">{shelfConfig.isActive ? 'Enabled' : 'Draft'}</span>
                                            <input 
                                                type="checkbox" 
                                                checked={shelfConfig.isActive} 
                                                onChange={e => setShelfConfig({...shelfConfig, isActive: e.target.checked})} 
                                                className="w-5 h-5 accent-[#C9A236] cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wide text-[#C9A236] block mb-1">Heading Line 1</label>
                                            <input 
                                                type="text" 
                                                value={shelfConfig.line1} 
                                                onChange={e => setShelfConfig({...shelfConfig, line1: e.target.value})} 
                                                className="w-full bg-black/35 border border-white/15 px-3 py-2 text-sm rounded-lg focus:border-[#C9A236] text-white placeholder-gray-400 outline-none"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wide text-[#C9A236] block mb-1">Heading Line 2</label>
                                            <input 
                                                type="text" 
                                                value={shelfConfig.line2} 
                                                onChange={e => setShelfConfig({...shelfConfig, line2: e.target.value})} 
                                                className="w-full bg-black/35 border border-white/15 px-3 py-2 text-sm rounded-lg focus:border-[#C9A236] text-white placeholder-gray-400 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wide text-[#C9A236] block mb-1">Highlighted Underline word</label>
                                            <input 
                                                type="text" 
                                                value={shelfConfig.underlineText} 
                                                onChange={e => setShelfConfig({...shelfConfig, underlineText: e.target.value})} 
                                                placeholder="Enter exact keyword to highlight"
                                                className="w-full bg-black/35 border border-white/15 px-3 py-2 text-sm rounded-lg focus:border-[#C9A236] text-white placeholder-gray-400 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <hr className="border-[#DFCFAF]/10" />

                                    {/* Draggable sliders + custom backgrounds buttons */}
                                    <div className="bg-[#07211B] p-4 rounded-2xl border border-[#DFCFAF]/10 space-y-4 text-black">
                                        <span className="text-[10px] font-bold text-[#C9A236] block uppercase tracking-wider">Button 1 Design Config</span>
                                        <div className="grid grid-cols-2 gap-2 text-black">
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-1">Text Label</label>
                                                <input type="text" value={shelfConfig.btn1Text} onChange={e => setShelfConfig({...shelfConfig, btn1Text: e.target.value})} className="bg-[#0A2922] border border-white/10 px-2.5 py-1.5 text-xs text-white rounded w-full outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-1">Target Route</label>
                                                <select value={shelfConfig.btn1Page} onChange={e => setShelfConfig({...shelfConfig, btn1Page: e.target.value})} className="bg-[#0A2922] border border-white/10 px-2.5 py-1.5 text-xs text-white rounded w-full outline-none">
                                                    {PAGE_ROUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-black">
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Bg Color</label>
                                                <div className="flex gap-1 items-center">
                                                    <input type="color" value={shelfConfig.btn1BgColor || "#C9A236"} onChange={e => setShelfConfig({...shelfConfig, btn1BgColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                    <input type="text" value={shelfConfig.btn1BgColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn1BgColor: e.target.value})} placeholder="#hex" className="bg-[#0A2922] border border-white/10 px-1 py-0.5 text-[9px] w-full rounded text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Text Color</label>
                                                <div className="flex gap-1 items-center">
                                                    <input type="color" value={shelfConfig.btn1TextColor || "#0F4A3C"} onChange={e => setShelfConfig({...shelfConfig, btn1TextColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                    <input type="text" value={shelfConfig.btn1TextColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn1TextColor: e.target.value})} placeholder="#hex" className="bg-[#0A2922] border border-white/10 px-1 py-0.5 text-[9px] w-full rounded text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-black">
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Border Color</label>
                                                <div className="flex gap-1 items-center">
                                                    <input type="color" value={shelfConfig.btn1BorderColor || "#ffffff"} onChange={e => setShelfConfig({...shelfConfig, btn1BorderColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                    <input type="text" value={shelfConfig.btn1BorderColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn1BorderColor: e.target.value})} placeholder="#hex" className="bg-[#0A2922] border border-white/10 px-1 py-0.5 text-[9px] w-full rounded text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Corner Round</label>
                                                <select value={shelfConfig.btn1BorderRadius || "pill"} onChange={e => setShelfConfig({...shelfConfig, btn1BorderRadius: e.target.value})} className="bg-black/50 border border-white/10 px-1 py-1 text-[9px] w-full rounded bg-transparent text-white focus:text-black">
                                                    <option className="bg-[#0A2922] text-white" value="sharp">Sharp</option>
                                                    <option className="bg-[#0A2922] text-white" value="rounded-sm">Subtle Soft</option>
                                                    <option className="bg-[#0A2922] text-white" value="rounded">Rounded</option>
                                                    <option className="bg-[#0A2922] text-white" value="rounded-xl">Highly Rounded</option>
                                                    <option className="bg-[#0A2922] text-white" value="pill">Pill</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-300 block mb-1">Horizontal Location X: {shelfConfig.btn1_x ?? 40}%</label>
                                            <input type="range" min="0" max="100" value={shelfConfig.btn1_x ?? 40} onChange={e => setShelfConfig({...shelfConfig, btn1_x: Number(e.target.value)})} className="w-full accent-[#C9A236]" />
                                        </div>
                                    </div>

                                    <div className="bg-[#07211B] p-4 rounded-2xl border border-[#DFCFAF]/10 space-y-4 font-sans text-black">
                                        <span className="text-[10px] font-bold text-[#C9A236] block uppercase tracking-wider">Button 2 Design Config</span>
                                        <div className="grid grid-cols-2 gap-2 text-black">
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-1">Text Label</label>
                                                <input type="text" value={shelfConfig.btn2Text} onChange={e => setShelfConfig({...shelfConfig, btn2Text: e.target.value})} className="bg-[#0A2922] border border-white/10 px-2.5 py-1.5 text-xs text-white rounded w-full outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-1">Target Route</label>
                                                <select value={shelfConfig.btn2Page} onChange={e => setShelfConfig({...shelfConfig, btn2Page: e.target.value})} className="bg-[#0A2922] border border-white/10 px-2.5 py-1.5 text-xs text-white rounded w-full outline-none">
                                                    {PAGE_ROUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-black">
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Bg Color</label>
                                                <div className="flex gap-1 items-center">
                                                    <input type="color" value={shelfConfig.btn2BgColor || "#000000"} onChange={e => setShelfConfig({...shelfConfig, btn2BgColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                    <input type="text" value={shelfConfig.btn2BgColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn2BgColor: e.target.value})} placeholder="#hex" className="bg-[#0A2922] border border-white/10 px-1 py-0.5 text-[9px] w-full rounded text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Text Color</label>
                                                <div className="flex gap-1 items-center">
                                                    <input type="color" value={shelfConfig.btn2TextColor || "#C9A236"} onChange={e => setShelfConfig({...shelfConfig, btn2TextColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                    <input type="text" value={shelfConfig.btn2TextColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn2TextColor: e.target.value})} placeholder="#hex" className="bg-[#0A2922] border border-white/10 px-1 py-0.5 text-[9px] w-full rounded text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-black">
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Border Color</label>
                                                <div className="flex gap-1 items-center">
                                                    <input type="color" value={shelfConfig.btn2BorderColor || "#C9A236"} onChange={e => setShelfConfig({...shelfConfig, btn2BorderColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                    <input type="text" value={shelfConfig.btn2BorderColor || ""} onChange={e => setShelfConfig({...shelfConfig, btn2BorderColor: e.target.value})} placeholder="#hex" className="bg-[#0A2922] border border-white/10 px-1 py-0.5 text-[9px] w-full rounded text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-[#DFCFAF] font-bold block mb-0.5">Corner Round</label>
                                                <select value={shelfConfig.btn2BorderRadius || "pill"} onChange={e => setShelfConfig({...shelfConfig, btn2BorderRadius: e.target.value})} className="bg-black/50 border border-white/10 px-1 py-1 text-[9px] w-full rounded bg-transparent text-white focus:text-black">
                                                    <option className="bg-[#0A2922] text-white" value="sharp">Sharp</option>
                                                    <option className="bg-[#0A2922] text-white" value="rounded-sm">Subtle Soft</option>
                                                    <option className="bg-[#0A2922] text-white" value="rounded">Rounded</option>
                                                    <option className="bg-[#0A2922] text-white" value="rounded-xl">Highly Rounded</option>
                                                    <option className="bg-[#0A2922] text-white" value="pill">Pill</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-300 block mb-1">Horizontal Location X: {shelfConfig.btn2_x ?? 60}%</label>
                                            <input type="range" min="0" max="100" value={shelfConfig.btn2_x ?? 60} onChange={e => setShelfConfig({...shelfConfig, btn2_x: Number(e.target.value)})} className="w-full accent-[#C9A236]" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {selectedBanner ? (
                                        <div className="space-y-4">
                                            {/* Studio Slide Selector Top bar */}
                                            <div className="bg-[#07211B] p-3 rounded-xl border border-white/10 flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-[#C9A236] uppercase tracking-wide">Workspace Slide:</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setSelectedBanner(null)} 
                                                        className="text-[9px] text-[#DFCFAF] hover:text-white underline"
                                                    >
                                                        ➔ Back to templates
                                                    </button>
                                                </div>
                                                <select
                                                    value={selectedBanner?.id || ""}
                                                    onChange={e => {
                                                        const found = carouselBanners.find(b => b.id === e.target.value);
                                                        if (found) setSelectedBanner(found);
                                                    }}
                                                    className="w-full bg-[#0A2922] text-sm text-white px-2.5 py-1.5 rounded-lg border border-white/15 outline-none font-bold"
                                                >
                                                    {carouselBanners.map(b => (
                                                        <option key={b.id} value={b.id}>{b.title || "Untitled slide"}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Connect product inside Fullscreen */}
                                            <div className="bg-[#07211B] p-3 rounded-xl border border-white/10 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-[#C9A236] block">Connect Product (Optional)</label>
                                                <select 
                                                    value={bannerForm.button_link_context?.product_id || ""} 
                                                    onChange={e => {
                                                        const pId = e.target.value;
                                                        const chosenProduct = products.find(p => p.id === pId);
                                                        if (chosenProduct) {
                                                            const img = chosenProduct.image_urls?.[0] || "";
                                                            setBannerForm(prev => ({
                                                                ...prev,
                                                                title: prev.title || chosenProduct.name,
                                                                subtitle: prev.subtitle || chosenProduct.tagline || chosenProduct.description || "",
                                                                image_url: img || prev.image_url,
                                                                button_link_page: 'product',
                                                                button_link_context: {
                                                                    ...prev.button_link_context,
                                                                    product_id: pId,
                                                                    show_product_badge: prev.button_link_context?.show_product_badge ?? true,
                                                                    buttons: prev.button_link_context?.buttons && prev.button_link_context?.buttons.length > 0 ? prev.button_link_context.buttons : [
                                                                        {
                                                                            id: 'btn-prod-1',
                                                                            text: `Buy ${chosenProduct.name} ➔`,
                                                                            link_page: 'product',
                                                                            link_path: pId,
                                                                            x: 50,
                                                                            y: 75
                                                                        }
                                                                    ]
                                                                }
                                                            }));
                                                        } else {
                                                            setBannerForm(prev => ({
                                                                ...prev,
                                                                button_link_context: {
                                                                    ...prev.button_link_context,
                                                                    product_id: "",
                                                                    show_product_badge: false
                                                                }
                                                            }));
                                                        }
                                                    }} 
                                                    className="w-full bg-[#0A2922] text-xs text-white p-2 rounded-lg border border-white/15 focus:border-[#C9A236] outline-none"
                                                >
                                                    <option className="bg-[#0A2922] text-white" value="">-- Connect active product --</option>
                                                    {products.map(p => (
                                                        <option className="bg-[#0A2922] text-white" key={p.id} value={p.id}>{p.name} (₹{p.product_variants?.[0]?.price || 'N/A'})</option>
                                                    ))}
                                                </select>
                                                
                                                {bannerForm.button_link_context?.product_id && (
                                                    <div className="flex items-center justify-between bg-black/25 p-2 rounded-lg border border-white/5">
                                                        <span className="text-[10px] text-[#DFCFAF] font-bold">Display Interactive Product Badge</span>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!bannerForm.button_link_context?.show_product_badge} 
                                                            onChange={e => setBannerForm({
                                                                ...bannerForm,
                                                                button_link_context: {
                                                                    ...bannerForm.button_link_context,
                                                                    show_product_badge: e.target.checked
                                                                }
                                                            })} 
                                                            className="w-4 h-4 accent-[#C9A236] cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* General controls in Fullscreen */}
                                            <div className="grid grid-cols-2 gap-2 bg-[#07211B] p-3 rounded-xl border border-white/10">
                                                <div>
                                                    <label className="text-[9px] uppercase font-bold text-[#DFCFAF] block mb-0.5">Deploy Status</label>
                                                    <div className="flex items-center gap-1.5 mt-1 bg-black/15 p-1 rounded border border-white/5">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={bannerForm.is_active} 
                                                            onChange={e => setBannerForm({...bannerForm, is_active: e.target.checked})} 
                                                            className="w-4 h-4 accent-[#C9A236] cursor-pointer"
                                                        />
                                                        <span className="text-[9px] text-gray-300 font-bold">Show Live</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] uppercase font-bold text-[#DFCFAF] block mb-0.5">Duration (secs)</label>
                                                    <input 
                                                        type="number" 
                                                        value={bannerForm.carousel_duration_seconds} 
                                                        onChange={e => setBannerForm({...bannerForm, carousel_duration_seconds: Number(e.target.value)})} 
                                                        className="w-full bg-black/35 border border-white/15 px-2.5 py-1 text-xs rounded text-white outline-none" 
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase text-[#C9A236] block mb-1">Banner Title overlay</label>
                                                <input type="text" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className="w-full bg-black/45 border border-white/15 px-3 py-2 text-sm text-white rounded-lg outline-none focus:border-[#C9A236]" />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase text-[#C9A236] block mb-1">Subtext / Promo description</label>
                                                <textarea value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} rows={2} className="w-full bg-black/45 border border-white/15 px-3 py-2 text-sm text-white rounded-lg outline-none resize-none focus:border-[#C9A236]" />
                                            </div>

                                            {/* Background Image Override Switcher */}
                                            <div className="bg-[#07211B] p-3 rounded-xl border border-white/10 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black uppercase text-[#C9A236] block">Background Media Image</label>
                                                    <span className="text-[8px] bg-[#C9A236]/15 text-[#C9A236] font-extrabold uppercase px-1.5 py-0.5 rounded">Device Responsive Banners</span>
                                                </div>
                                                
                                                {/* Device selectors for individual image overrides */}
                                                <div className="grid grid-cols-3 gap-1 bg-black/35 rounded-lg p-0.5 border border-white/5">
                                                    {(['desktop', 'tablet', 'mobile'] as const).map(tab => {
                                                        const val = tab === 'desktop' ? bannerForm.image_url : bannerForm.button_link_context?.[`image_url_${tab}`];
                                                        return (
                                                            <button
                                                                key={tab}
                                                                type="button"
                                                                onClick={() => {
                                                                    // Set fullscreenDevice layout preview switch so they see the actual layout too!
                                                                    if (tab === 'desktop') setFullscreenDevice('desktop');
                                                                    else if (tab === 'tablet') setFullscreenDevice('tablet');
                                                                    else if (tab === 'mobile') setFullscreenDevice('mobile');
                                                                }}
                                                                className={`py-1 rounded text-[9px] uppercase font-black transition-all ${
                                                                    (tab === 'desktop' && (fullscreenDevice === 'desktop' || fullscreenDevice === 'widescreen')) ||
                                                                    (tab === 'tablet' && fullscreenDevice === 'tablet') ||
                                                                    (tab === 'mobile' && fullscreenDevice === 'mobile')
                                                                        ? 'bg-[#C9A236] text-black shadow'
                                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                                }`}
                                                            >
                                                                {tab === 'desktop' ? '💻 Laptop' : tab === 'tablet' ? '📁 Tablet' : '📱 Phone'}
                                                                {val ? ' ✓' : ''}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Premium Recommended Dimensions Infobox */}
                                                <div className="bg-black/35 p-2 rounded-lg border border-white/5 space-y-1.5 text-left mb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px]">📐</span>
                                                            <span className="text-[8px] font-black uppercase text-[#C9A236] tracking-wider">Recommended Viewport Specs ({fullscreenDevice.toUpperCase()})</span>
                                                        </div>
                                                        <span className="text-[7px] text-[#DFCFAF] font-bold uppercase">{orientation.toUpperCase()}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1 text-[7.5px] leading-tight text-gray-300 font-sans">
                                                        <div className={`p-1 rounded border space-y-0.5 transition-all ${['widescreen', 'desktop'].includes(fullscreenDevice) ? 'bg-[#DFCFAF]/10 border-[#DFCFAF]/25 scale-102 font-semibold' : 'bg-white/5 border-white/5 opacity-60'}`}>
                                                            <span className="font-bold text-white block">💻 Desktop</span>
                                                            <span className="text-gray-400 block">Wide 16:9 / 21:9</span>
                                                            <span className="text-[#C9A236] font-bold block">1920x800 px</span>
                                                            <span className="text-gray-400 block">Btn Scale: 100%</span>
                                                        </div>
                                                        <div className={`p-1 rounded border space-y-0.5 transition-all ${fullscreenDevice === 'tablet' ? 'bg-[#DFCFAF]/10 border-[#DFCFAF]/25 scale-102 font-semibold' : 'bg-white/5 border-white/5 opacity-60'}`}>
                                                            <span className="font-bold text-white block">📁 Tablet</span>
                                                            <span className="text-gray-400 block">{orientation === 'portrait' ? 'Portrait 3:4' : 'Landscape 4:3'}</span>
                                                            <span className="text-[#C9A236] font-bold block">{orientation === 'portrait' ? '900x1200 px' : '1200x900 px'}</span>
                                                            <span className="text-gray-400 block">Btn Scale: 85%</span>
                                                        </div>
                                                        <div className={`p-1 rounded border space-y-0.5 transition-all ${fullscreenDevice === 'mobile' ? 'bg-[#DFCFAF]/10 border-[#DFCFAF]/25 scale-102 font-semibold' : 'bg-white/5 border-white/5 opacity-60'}`}>
                                                            <span className="font-bold text-white block">📱 Phone</span>
                                                            <span className="text-gray-400 block">{orientation === 'portrait' ? 'Portrait 9:16' : 'Landscape 16:9'}</span>
                                                            <span className="text-[#C9A236] font-bold block">{orientation === 'portrait' ? '820x1460 px' : '1460x820 px'}</span>
                                                            <span className="text-gray-400 block">Btn Scale: 75%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Active background editor */}
                                                <div className="space-y-1.5 text-left bg-black/10 p-3 rounded-xl border border-white/5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] text-[#DFCFAF] uppercase font-black tracking-wider">
                                                            {fullscreenDevice === 'mobile' 
                                                                ? `📱 Mobile (${orientation}) Backdrop` 
                                                                : fullscreenDevice === 'tablet' 
                                                                    ? `📁 Tablet (${orientation}) Backdrop` 
                                                                    : '💻 Laptop Background Image'}
                                                        </span>
                                                        {(fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet') && 
                                                            bannerForm.button_link_context?.[`image_url_${fullscreenDevice}_${orientation}`] && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setBannerForm((prev: any) => ({
                                                                        ...prev,
                                                                        button_link_context: {
                                                                            ...prev.button_link_context,
                                                                            [`image_url_${fullscreenDevice}_${orientation}`]: undefined
                                                                        }
                                                                    }));
                                                                }}
                                                                className="text-[8px] text-red-400 hover:text-red-300 font-extrabold uppercase hover:underline animate-fade-in"
                                                            >
                                                                Reset {orientation} Override
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1.5 font-sans">
                                                        <input 
                                                            type="text" 
                                                            value={
                                                                fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet'
                                                                    ? (bannerForm.button_link_context?.[`image_url_${fullscreenDevice}_${orientation}`] || "")
                                                                    : (bannerForm.image_url || "")
                                                            } 
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                if (fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet') {
                                                                    setBannerForm((prev: any) => ({
                                                                        ...prev,
                                                                        button_link_context: {
                                                                            ...prev.button_link_context,
                                                                            [`image_url_${fullscreenDevice}_${orientation}`]: val || undefined
                                                                        }
                                                                    }));
                                                                } else {
                                                                    setBannerForm({...bannerForm, image_url: val});
                                                                }
                                                            }} 
                                                            placeholder={
                                                                fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet'
                                                                    ? `Override URL for ${fullscreenDevice} ${orientation} (falls back to Laptop)`
                                                                    : "Direct background cover image URL source"
                                                            }
                                                            className="flex-1 bg-black/35 border border-white/15 px-2 py-1.5 text-xs rounded text-white outline-none placeholder:text-gray-500" 
                                                        />
                                                        <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold rounded cursor-pointer transition-all flex items-center shrink-0">
                                                            <span>{uploading ? "..." : "📁 Upload"}</span>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={e => {
                                                                    const isMobileOrTablet = fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet';
                                                                    handleBannerImageUpload(e, isMobileOrTablet ? `${fullscreenDevice}_${orientation}` : 'desktop');
                                                                }} 
                                                                disabled={uploading} 
                                                                className="hidden" 
                                                            />
                                                        </label>
                                                    </div>

                                                    {/* General Fallback background for Mobile / Tablet */}
                                                    {(fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet') && (
                                                        <div className="space-y-1 font-sans border-t border-white/5 pt-1.5 mt-1.5 text-left">
                                                            <span className="text-[7.5px] text-gray-400 block font-bold leading-normal">
                                                                💡 General <strong>{fullscreenDevice} fallback</strong> backdrop (used across orientations if active `{orientation}` override is not specified):
                                                            </span>
                                                            <div className="flex gap-1.5">
                                                                <input 
                                                                    type="text"
                                                                    value={bannerForm.button_link_context?.[`image_url_${fullscreenDevice}`] || ""}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setBannerForm((prev: any) => ({
                                                                            ...prev,
                                                                            button_link_context: {
                                                                                ...prev.button_link_context,
                                                                                [`image_url_${fullscreenDevice}`]: val || undefined
                                                                            }
                                                                        }));
                                                                    }}
                                                                    placeholder={`General ${fullscreenDevice} backdrop fallback URL`}
                                                                    className="flex-1 bg-black/35 border border-white/15 px-2 py-1 text-[10px] rounded text-white outline-none placeholder:text-gray-600"
                                                                />
                                                                <label className="px-2 py-1 bg-white/5 hover:bg-white/15 border border-white/15 text-white text-[9px] font-bold rounded cursor-pointer transition-all flex items-center shrink-0">
                                                                    <span>{uploading ? "..." : "Upload Fallback"}</span>
                                                                    <input 
                                                                        type="file" 
                                                                        accept="image/*" 
                                                                        onChange={e => {
                                                                            handleBannerImageUpload(e, fullscreenDevice);
                                                                        }} 
                                                                        disabled={uploading} 
                                                                        className="hidden" 
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Text Visibility Option */}
                                            <div className="flex items-center justify-between p-2 bg-[#07211B] rounded-xl border border-white/10">
                                                <label className="text-[10px] font-black uppercase text-[#C9A236]">Show Headline Overlays</label>
                                                <div className="flex items-center gap-1.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!getLayoutValue('hide_text', false)} 
                                                        onChange={e => updateLayoutValue('hide_text', !e.target.checked)} 
                                                        className="w-4 h-4 accent-[#C9A236] cursor-pointer"
                                                     />
                                                     <span className="text-[9px] text-gray-300 font-bold">Show Text Overlay</span>
                                                </div>
                                             </div>

                                            {/* Image Layout Mode Selector */}
                                            <div className="bg-[#07211B] p-3 rounded-xl border border-white/10 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-[#C9A236] block">Image Render Layout Mode</label>
                                                <select
                                                    value={bannerForm.button_link_context?.image_mode || "split"}
                                                    onChange={e => setBannerForm({
                                                        ...bannerForm,
                                                        button_link_context: {
                                                            ...bannerForm.button_link_context,
                                                            image_mode: e.target.value,
                                                            image_x: bannerForm.button_link_context?.image_x ?? 50,
                                                            image_y: bannerForm.button_link_context?.image_y ?? 50,
                                                            image_scale: bannerForm.button_link_context?.image_scale ?? 100
                                                        }
                                                    })}
                                                    className="w-full bg-[#0A2922] text-xs text-white p-2 rounded-lg border border-white/15 focus:border-[#C9A236] outline-none font-bold"
                                                >
                                                    <option className="bg-[#0A2922] text-white" value="split">Split-Screen (Left graphic, Right description)</option>
                                                    <option className="bg-[#0A2922] text-white" value="bg">Full Cover Background behind content</option>
                                                    <option className="bg-[#0A2922] text-[#DFCFAF]" value="bg_over_content">Background Over All Content (Graphic Only / No overlay text panel)</option>
                                                    <option className="bg-[#0A2922] text-white" value="draggable">Draggable Front Overlay Element</option>
                                                </select>

                                                {(bannerForm.button_link_context?.image_mode === "bg" || bannerForm.button_link_context?.image_mode === "bg_over_content") && (
                                                    <div className="space-y-2">
                                                        <div className="p-2 bg-black/20 rounded-lg space-y-1 text-white border border-white/5">
                                                            <span className="text-[9px] text-[#C9A236] font-black uppercase block">🖼️ Background Image Fit</span>
                                                            <select
                                                                value={bannerForm.button_link_context?.bg_fit || "cover"}
                                                                onChange={e => setBannerForm({
                                                                    ...bannerForm,
                                                                    button_link_context: {
                                                                        ...bannerForm.button_link_context,
                                                                        bg_fit: e.target.value
                                                                    }
                                                                })}
                                                                className="w-full bg-[#0A2922] text-xs text-white p-2 rounded-lg border border-white/10 focus:border-[#C9A236] outline-none font-bold"
                                                            >
                                                                <option className="bg-[#0A2922] text-white" value="cover">Fill & Stretch Background (Cover)</option>
                                                                <option className="bg-[#0A2922] text-white" value="contain">Fit Entire Image Context (Contain / No Cropping)</option>
                                                            </select>
                                                        </div>

                                                        {/* Background Image Brightness control */}
                                                        <div className="p-2 bg-black/20 rounded-lg space-y-1 text-white border border-white/5">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[9px] text-[#C9A236] font-black uppercase block">☀️ Background Brightness</span>
                                                                <span className="text-[9px] text-gray-300 font-bold">{(bannerForm.button_link_context?.bg_brightness !== undefined ? bannerForm.button_link_context.bg_brightness : 100)}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" 
                                                                min="20" 
                                                                max="150" 
                                                                value={(bannerForm.button_link_context?.bg_brightness !== undefined ? bannerForm.button_link_context.bg_brightness : 100)} 
                                                                onChange={e => setBannerForm({
                                                                    ...bannerForm,
                                                                    button_link_context: {
                                                                        ...bannerForm.button_link_context,
                                                                        bg_brightness: Number(e.target.value)
                                                                    }
                                                                })}
                                                                className="w-full accent-[#C9A236] cursor-pointer" 
                                                            />
                                                        </div>

                                                        <div className="p-2 bg-black/20 rounded-lg space-y-1 text-white border border-white/5">
                                                            <span className="text-[9px] text-[#C9A236] font-black uppercase block">📐 Hero Height & proportion</span>
                                                            <select
                                                                value={bannerForm.button_link_context?.container_aspect || "default"}
                                                                onChange={e => setBannerForm({
                                                                    ...bannerForm,
                                                                    button_link_context: {
                                                                        ...bannerForm.button_link_context,
                                                                        container_aspect: e.target.value
                                                                    }
                                                                })}
                                                                className="w-full bg-[#0A2922] text-xs text-white p-2 rounded-lg border border-white/10 focus:border-[#C9A236] outline-none font-bold"
                                                            >
                                                                <option className="bg-[#0A2922] text-white" value="default">Default Tall Screen (60vh to 85vh height)</option>
                                                                <option className="bg-[#0A2922] text-[#DFCFAF]" value="auto">Auto Aspect Ratio (Match Image Aspect Ratio perfectly!)</option>
                                                                <option className="bg-[#0A2922] text-[#DFCFAF]" value="custom">Custom Dimensions (Manually Entered size specifications)</option>
                                                                <option className="bg-[#0A2922] text-white" value="aspect-21/7">Ultra-Widescreen Banner (21:9 - 21:7)</option>
                                                                <option className="bg-[#0A2922] text-white" value="aspect-16/9">Standard Widescreen HD (16:9)</option>
                                                                <option className="bg-[#0A2922] text-white" value="aspect-4/3">Standard Classic (4:3)</option>
                                                                <option className="bg-[#0A2922] text-white" value="aspect-1/1">Square Size (1:1)</option>
                                                            </select>
                                                            <p className="text-[8px] text-[#DFCFAF]/70 mt-0.5">Tip: Matching your image's aspect ratio removes empty vertical margins around the image!</p>
                                                        </div>

                                                        {bannerForm.button_link_context?.container_aspect === 'custom' && (
                                                            <div className="p-2 bg-black/20 rounded-lg space-y-2 text-white border border-white/5">
                                                                <span className="text-[9px] text-[#C9A236] font-black uppercase block">📏 Custom Dimensions Style</span>
                                                                <div className="grid grid-cols-2 gap-2 text-black">
                                                                    <div>
                                                                        <label className="text-[8px] text-gray-300 block mb-0.5 font-bold">Custom Height (e.g. 400px, 50vh)</label>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="e.g. 350px" 
                                                                            value={bannerForm.button_link_context?.custom_height || ""} 
                                                                            onChange={e => setBannerForm({
                                                                                ...bannerForm,
                                                                                button_link_context: {
                                                                                    ...bannerForm.button_link_context,
                                                                                    custom_height: e.target.value
                                                                                }
                                                                            })} 
                                                                            className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-xs text-white"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[8px] text-gray-300 block mb-0.5 font-bold">Custom Max Width (e.g. 1000px, 100%)</label>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="e.g. 100%" 
                                                                            value={bannerForm.button_link_context?.custom_width || ""} 
                                                                            onChange={e => setBannerForm({
                                                                                ...bannerForm,
                                                                                button_link_context: {
                                                                                    ...bannerForm.button_link_context,
                                                                                    custom_width: e.target.value
                                                                                }
                                                                            })} 
                                                                            className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-xs text-white"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="p-2 bg-black/20 rounded-lg space-y-1.5 text-white border border-white/5">
                                                    <div className="flex gap-2 items-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!bannerForm.button_link_context?.clickable_slide} 
                                                            onChange={e => setBannerForm({
                                                                ...bannerForm,
                                                                button_link_context: {
                                                                    ...bannerForm.button_link_context,
                                                                    clickable_slide: e.target.checked
                                                                }
                                                            })} 
                                                            className="w-3.5 h-3.5 accent-[#C9A236] cursor-pointer"
                                                        />
                                                        <span className="text-[9px] text-[#C9A236] font-black uppercase">🔗 Make Entire Slide Clickable</span>
                                                    </div>
                                                    {bannerForm.button_link_context?.clickable_slide && (
                                                        <div className="mt-1.5 space-y-2">
                                                            <div>
                                                                <label className="text-[8px] text-gray-300 block">Where should clicking the background/image redirect to?</label>
                                                                <select
                                                                    value={bannerForm.button_link_context?.slide_link_page || "shop"}
                                                                    onChange={e => setBannerForm({
                                                                        ...bannerForm,
                                                                        button_link_context: {
                                                                            ...bannerForm.button_link_context,
                                                                            slide_link_page: e.target.value
                                                                        }
                                                                    })}
                                                                    className="w-full bg-[#0A2922] text-[10px] text-white p-1 rounded border border-white/10"
                                                                >
                                                                    {PAGE_ROUTE_OPTIONS.map(o => (
                                                                        <option className="bg-[#0A2922] text-white" key={o.value} value={o.value}>{o.label}</option>
                                                                    ))}
                                                                    <option className="bg-[#0A2922] text-white" value="product">Single Specific Product</option>
                                                                </select>
                                                            </div>

                                                            {bannerForm.button_link_context?.slide_link_page === 'product' && (
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] text-[#DFCFAF] block font-bold">Target Product Destination</label>
                                                                    <select 
                                                                        value={bannerForm.button_link_context?.slide_product_id || ""} 
                                                                        onChange={e => setBannerForm({
                                                                            ...bannerForm,
                                                                            button_link_context: {
                                                                                ...bannerForm.button_link_context,
                                                                                slide_product_id: e.target.value
                                                                            }
                                                                        })}
                                                                        className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-[10px] text-white outline-none"
                                                                    >
                                                                        <option className="bg-[#0A2922] text-white" value="">-- Select Product --</option>
                                                                        {products.map((p: any) => (
                                                                            <option className="bg-[#0A2922] text-white" key={p.id} value={p.id}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            {bannerForm.button_link_context?.slide_link_page === 'shop' && (
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] text-[#DFCFAF] block font-semibold">Category Filter (Optional)</label>
                                                                    <select 
                                                                        value={bannerForm.button_link_context?.slide_category || ""} 
                                                                        onChange={e => setBannerForm({
                                                                            ...bannerForm,
                                                                            button_link_context: {
                                                                                ...bannerForm.button_link_context,
                                                                                slide_category: e.target.value
                                                                            }
                                                                        })}
                                                                        className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-[10px] text-white outline-none"
                                                                    >
                                                                        <option className="bg-[#0A2922] text-white" value="">-- All Products (No Filter) --</option>
                                                                        {categories.map((c: any) => (
                                                                            <option className="bg-[#0A2922] text-white" key={c.id} value={c.name}>{c.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {bannerForm.button_link_context?.image_mode === "draggable" && (
                                                    <div className="p-2.5 bg-black/20 rounded-lg space-y-2 border border-white/5 text-white">
                                                        <span className="text-[9px] text-[#C9A236] font-black uppercase block">🎨 Overlay Position & Scale</span>
                                                        
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[8px] text-gray-300 block">X Location: {getLayoutValue('image_x', 50)}%</label>
                                                                <input 
                                                                    type="range" 
                                                                    min="0" 
                                                                    max="100" 
                                                                    value={getLayoutValue('image_x', 50)} 
                                                                    onChange={e => updateLayoutValue('image_x', Number(e.target.value))} 
                                                                    className="w-full accent-[#C9A236]" 
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] text-gray-300 block">Y Location: {getLayoutValue('image_y', 50)}%</label>
                                                                <input 
                                                                    type="range" 
                                                                    min="0" 
                                                                    max="100" 
                                                                    value={getLayoutValue('image_y', 50)} 
                                                                    onChange={e => updateLayoutValue('image_y', Number(e.target.value))} 
                                                                    className="w-full accent-[#C9A236]" 
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-[8px] text-gray-300 block">Graphic Size Scale: {getLayoutValue('image_scale', 100)}%</label>
                                                            <input 
                                                                type="range" 
                                                                min="20" 
                                                                max="250" 
                                                                value={getLayoutValue('image_scale', 100)} 
                                                                onChange={e => updateLayoutValue('image_scale', Number(e.target.value))} 
                                                                className="w-full accent-[#C9A236]" 
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-black">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-[#C9A236] mb-1 block">Contrast Overlay: {bannerForm.overlay_opacity}%</label>
                                                    <input type="range" min="0" max="75" value={bannerForm.overlay_opacity} onChange={e => setBannerForm({...bannerForm, overlay_opacity: Number(e.target.value)})} className="w-full accent-[#C9A236]" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-[#C9A236] mb-1 block">Text Align</label>
                                                    <select value={bannerForm.text_alignment} onChange={e => setBannerForm({...bannerForm, text_alignment: e.target.value})} className="w-full bg-[#0A2922] border border-white/15 px-3 py-2 text-sm text-white rounded-lg outline-none">
                                                        <option className="bg-[#0A2922] text-white" value="left">Left Aligned</option>
                                                        <option className="bg-[#0A2922] text-white" value="center">Centered</option>
                                                        <option className="bg-[#0A2922] text-white" value="right">Right Aligned</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-[#C9A236] mb-1 block">Theme Preset</label>
                                                    <select value={bannerForm.color_scheme || 'green'} onChange={e => setBannerForm({...bannerForm, color_scheme: e.target.value})} className="w-full bg-[#0A2922] border border-white/15 px-3 py-2 text-sm text-white rounded-lg outline-none">
                                                        <option className="bg-[#0A2922] text-white" value="green">Forest Green</option>
                                                        <option className="bg-[#0A2922] text-white" value="beige">Warm Beige</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Custom Text Position & Scale Controls */}
                                            <div className="bg-[#07211B] p-3 rounded-xl border border-white/10 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black uppercase text-[#C9A236] block">Custom Text position & scale</label>
                                                    <div className="flex items-center gap-1.5 bg-black/25 px-2 py-1 rounded border border-white/10">
                                                        <input 
                                                            type="checkbox" 
                                                            id="text-custom-checkbox"
                                                            checked={!!bannerForm.button_link_context?.text_custom} 
                                                            onChange={e => setBannerForm({
                                                                ...bannerForm,
                                                                button_link_context: {
                                                                    ...bannerForm.button_link_context,
                                                                    text_custom: e.target.checked,
                                                                    text_x: bannerForm.button_link_context?.text_x ?? 50,
                                                                    text_y: bannerForm.button_link_context?.text_y ?? 40,
                                                                    text_scale: bannerForm.button_link_context?.text_scale ?? 100
                                                                }
                                                            })} 
                                                            className="w-3.5 h-3.5 accent-[#C9A236] cursor-pointer"
                                                        />
                                                        <label htmlFor="text-custom-checkbox" className="text-[9px] text-gray-300 font-bold select-none cursor-pointer">Enable</label>
                                                    </div>
                                                </div>

                                                {bannerForm.button_link_context?.text_custom && (
                                                    <div className="space-y-2 text-white">
                                                        <div className="grid grid-cols-2 gap-2">
                                                             <div>
                                                                 <label className="text-[8px] text-gray-300 block">X Location: {getLayoutValue('text_x', 50)}%</label>
                                                                 <input 
                                                                     type="range" 
                                                                     min="0" 
                                                                     max="100" 
                                                                     value={getLayoutValue('text_x', 50)} 
                                                                     onChange={e => updateLayoutValue('text_x', Number(e.target.value))} 
                                                                     className="w-full accent-[#C9A236]" 
                                                                 />
                                                             </div>
                                                             <div>
                                                                 <label className="text-[8px] text-gray-300 block">Y Location: {getLayoutValue('text_y', 40)}%</label>
                                                                 <input 
                                                                     type="range" 
                                                                     min="0" 
                                                                     max="100" 
                                                                     value={getLayoutValue('text_y', 40)} 
                                                                     onChange={e => updateLayoutValue('text_y', Number(e.target.value))} 
                                                                     className="w-full accent-[#C9A236]" 
                                                                 />
                                                             </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] text-gray-300 block">Text Size Scale: {getLayoutValue('text_scale', 100)}%</label>
                                                            <input 
                                                                type="range" 
                                                                min="30" 
                                                                max="250" 
                                                                value={getLayoutValue('text_scale', 100)} 
                                                                onChange={e => updateLayoutValue('text_scale', Number(e.target.value))} 
                                                                className="w-full accent-[#C9A236]" 
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Button Config loop */}
                                            <div className="p-4 bg-black/25 rounded-2xl border border-white/10 space-y-3">
                                                <div className="flex flex-col gap-2 w-full">
                                                    <span className="text-[10px] font-bold text-[#C9A236] uppercase tracking-wide">Slide Buttons & Hotspots ({bannerForm.button_link_context?.buttons?.length || 0})</span>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        <button 
                                                            type="button" 
                                                            onClick={handleAddButton} 
                                                            className="text-[9px] bg-white/10 hover:bg-[#C9A236]/25 hover:text-white text-[#DFCFAF] font-bold px-2 py-1 rounded-lg border border-white/20 transition-all font-sans"
                                                            title="Add standard styled button onto the slide"
                                                        >
                                                            + Standard Button
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setIsDrawingMode(true);
                                                                alert("📐 Click-and-Drag Mode activated!\n\nJust click and draw a box directly on the visual slide background image frame below to add a hotspot.");
                                                            }} 
                                                            className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all font-sans ${isDrawingMode ? 'bg-[#C9A236] text-[#0A2922] border-white/40 animate-pulse' : 'bg-white/10 hover:bg-[#C9A236]/25 hover:text-white text-[#DFCFAF] border-white/20'}`}
                                                            title="Draw an invisible click hotspot directly on the frame"
                                                        >
                                                            {isDrawingMode ? "📐 Drawing Area..." : "🔲 Draw Hotspot"}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setBannerForm((prev: any) => ({
                                                                    ...prev,
                                                                    button_link_context: {
                                                                        ...prev.button_link_context,
                                                                        clickable_slide: !prev.button_link_context?.clickable_slide
                                                                    }
                                                                }));
                                                            }} 
                                                            className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all font-sans ${bannerForm.button_link_context?.clickable_slide ? 'bg-[#DFCFAF] text-[#0A2922] border-[#C9A236]' : 'bg-white/10 hover:bg-[#C9A236]/25 hover:text-white text-[#DFCFAF] border-white/20'}`}
                                                            title="Allow clicking anywhere on the background image to redirect"
                                                        >
                                                            🔗 Clickable background: {bannerForm.button_link_context?.clickable_slide ? "ON" : "OFF"}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 max-h-[25vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                                    {(bannerForm.button_link_context?.buttons || []).map((btn: any, idx: number) => (
                                                        <div key={btn.id} className="p-3 bg-black/30 border border-white/10 rounded-xl space-y-2 relative text-white">
                                                            <button type="button" onClick={() => handleRemoveButton(btn.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 text-[10px] font-black">
                                                                ✕ Remove
                                                            </button>
                                                            <span className="text-[9px] bg-white/15 text-white font-bold px-2 py-0.5 rounded-full">Button #{idx + 1}</span>

                                                            <div className="grid grid-cols-2 gap-2 text-black">
                                                                <div>
                                                                    <label className="text-[8px] text-gray-300 block">Label</label>
                                                                    <input type="text" value={btn.text} onChange={e => handleUpdateButton(btn.id, 'text', e.target.value)} className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-xs text-white" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-gray-300 block">Route</label>
                                                                    <select value={btn.link_page} onChange={e => handleUpdateButton(btn.id, 'link_page', e.target.value)} className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-xs text-white">
                                                                        {PAGE_ROUTE_OPTIONS.map(o => <option className="bg-[#0A2922] text-white" key={o.value} value={o.value}>{o.label}</option>)}
                                                                         <option className="bg-[#0A2922] text-white" value="product">Single Specific Product</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {btn.link_page === 'product' && (
                                                                <div className="text-black space-y-1">
                                                                    <label className="text-[8px] text-[#DFCFAF] block font-bold">Target Product Destination</label>
                                                                    <select 
                                                                        value={btn.context?.productId || ""} 
                                                                        onChange={e => handleUpdateButton(btn.id, 'context', { ...btn.context, productId: e.target.value })}
                                                                        className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-xs text-white outline-none"
                                                                    >
                                                                        <option className="bg-[#0A2922] text-white" value="">-- Select Product --</option>
                                                                        {products.map((p: any) => (
                                                                            <option className="bg-[#0A2922] text-white" key={p.id} value={p.id}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            {btn.link_page === 'shop' && (
                                                                <div className="text-black space-y-1">
                                                                    <label className="text-[8px] text-[#DFCFAF] block font-bold">Target Category Filter</label>
                                                                    <select 
                                                                        value={btn.context?.category || ""} 
                                                                        onChange={e => handleUpdateButton(btn.id, 'context', { ...btn.context, category: e.target.value })}
                                                                        className="w-full bg-[#0A2922] border border-white/15 p-1 rounded text-xs text-white outline-none"
                                                                    >
                                                                        <option className="bg-[#0A2922] text-white" value="">-- All Products (No Filter) --</option>
                                                                        {categories.map((c: any) => (
                                                                            <option className="bg-[#0A2922] text-white" key={c.id} value={c.name}>{c.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-2 text-black">
                                                                <div>
                                                                    <label className="text-[8px] text-gray-300 block">Bg Color</label>
                                                                    <div className="flex gap-1 items-center">
                                                                        <input type="color" value={btn.bg_color || "#FCF2D5"} onChange={e => handleUpdateButton(btn.id, 'bg_color', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
                                                                        <input type="text" value={btn.bg_color || ""} onChange={e => handleUpdateButton(btn.id, 'bg_color', e.target.value)} className="bg-[#0A2922] border border-white/10 px-1 text-[8px] w-full rounded text-white" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-gray-300 block">Txt Color</label>
                                                                    <div className="flex gap-1 items-center">
                                                                        <input type="color" value={btn.text_color || "#0F4A3C"} onChange={e => handleUpdateButton(btn.id, 'text_color', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
                                                                        <input type="text" value={btn.text_color || ""} onChange={e => handleUpdateButton(btn.id, 'text_color', e.target.value)} className="bg-[#0A2922] border border-white/10 px-1 text-[8px] w-full rounded text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 py-1">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={!!btn.is_hotspot} 
                                                                    onChange={e => handleUpdateButton(btn.id, 'is_hotspot', e.target.checked)} 
                                                                    className="w-3.5 h-3.5 accent-[#C9A236] cursor-pointer"
                                                                    id={`is_hotspot_${btn.id}`}
                                                                />
                                                                <label htmlFor={`is_hotspot_${btn.id}`} className="text-[9px] text-[#C9A236] font-black uppercase cursor-pointer select-none">
                                                                    Make Button an Invisible Hotspot Area
                                                                </label>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[8px] text-[#DFCFAF] block">X: {getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).x}%</label>
                                                                    <input type="range" min="0" max="100" value={getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).x} onChange={e => updateLayoutButtonValue(btn.id, 'x', Number(e.target.value))} className="w-full accent-[#C9A236]" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-[#DFCFAF] block">Y: {getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).y}%</label>
                                                                    <input type="range" min="0" max="100" value={getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).y} onChange={e => updateLayoutButtonValue(btn.id, 'y', Number(e.target.value))} className="w-full accent-[#C9A236]" />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="text-[8px] text-[#DFCFAF] block">Button Size Scale: {getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).scale}%</label>
                                                                <input type="range" min="30" max="250" value={getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).scale} onChange={e => updateLayoutButtonValue(btn.id, 'scale', Number(e.target.value))} className="w-full accent-[#C9A236]" />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[8px] text-[#DFCFAF] block">
                                                                        Btn Width: {(() => {
                                                                            const coord = getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale);
                                                                            return coord.width && coord.width > 0 ? `${coord.width}px` : 'Auto';
                                                                        })()}
                                                                    </label>
                                                                    <input 
                                                                        type="range" 
                                                                        min="0" 
                                                                        max="350" 
                                                                        value={getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).width || 0} 
                                                                        onChange={e => updateLayoutButtonValue(btn.id, 'width', Number(e.target.value))} 
                                                                        className="w-full accent-[#C9A236]" 
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-[#DFCFAF] block">
                                                                        Btn Height: {(() => {
                                                                            const coord = getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale);
                                                                            return coord.height && coord.height > 0 ? `${coord.height}px` : 'Auto';
                                                                        })()}
                                                                    </label>
                                                                    <input 
                                                                        type="range" 
                                                                        min="0" 
                                                                        max="120" 
                                                                        value={getLayoutButtonCoordinates(btn.id, btn.x, btn.y, btn.scale).height || 0} 
                                                                        onChange={e => updateLayoutButtonValue(btn.id, 'height', Number(e.target.value))} 
                                                                        className="w-full accent-[#C9A236]" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 space-y-4">
                                            <span className="text-sm text-gray-400 block italic">✨ Choose a sliding banner template below to layout buttons visually:</span>
                                            <div className="space-y-2">
                                                {carouselBanners.map(b => (
                                                    <button 
                                                        key={b.id} 
                                                        onClick={() => setSelectedBanner(b)}
                                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 text-xs font-bold text-[#DFCFAF] flex justify-between items-center"
                                                    >
                                                        <span>{b.title || "Untitled Banner"}</span>
                                                        <span className="text-[#C9A236] text-[10px]">Customize ➔</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Action Bar */}
                        <div className="p-5 bg-[#07211B] border-t border-[#DFCFAF]/15 flex gap-3">
                            {activeTab === 'shelf' ? (
                                <button 
                                    onClick={async () => {
                                        await handleSaveShelf();
                                        setIsFullscreen(false);
                                    }}
                                    className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-yellow-500/10 active:scale-95 transition-all text-center"
                                >
                                    Save & Deploy Moving Shelf 📦
                                </button>
                            ) : (
                                selectedBanner && (
                                    <div className="flex gap-2.5 w-full">
                                        {selectedBanner.id && (
                                            <button 
                                                onClick={async () => {
                                                    await handleDeleteBanner(selectedBanner.id);
                                                    setIsFullscreen(false);
                                                }}
                                                className="py-3 px-5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs active:scale-95 transition-all text-center whitespace-nowrap"
                                            >
                                                🗑️ Delete Banner
                                            </button>
                                        )}
                                        <button 
                                            onClick={async () => {
                                                await handleSaveBannerForm();
                                                setIsFullscreen(false);
                                            }}
                                            className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-yellow-500/10 active:scale-95 transition-all text-center"
                                        >
                                            Save & Deploy Banner 🎨
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* RIGHT VIEWPORT WORKSTATION */}
                    <div className="flex-1 bg-[#05110e] p-6 flex flex-col min-h-[600px] md:h-full relative overflow-visible md:overflow-hidden">
                        {/* Viewport Top switcher bar */}
                        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 pb-6 border-b border-[#DFCFAF]/10 w-full mb-auto z-10">
                            <div>
                                <span className="text-xs text-[#C9A236] uppercase tracking-widest block font-bold">Responsive Sandbox Rulers</span>
                                <h1 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                                    Live WYSIWYG Device Viewport Canvas
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Mode Selector */}
                                <div className="flex bg-[#0A2922] p-1 rounded-full border border-white/10 gap-1">
                                    <button
                                        onClick={() => setPreviewMode('edit')}
                                        className={`px-4 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${previewMode === 'edit' ? 'bg-[#DFCFAF] text-[#0A2922]' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        🛠️ Sandbox Edit
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('replica')}
                                        className={`px-4 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${previewMode === 'replica' ? 'bg-[#C9A236] text-black shadow-lg shadow-[#C9A236]/20' : 'text-gray-400 hover:text-white'}`}
                                        title="Simulate exactly how this slide will look on the live storefront"
                                    >
                                        👁️ Website Replica
                                    </button>
                                </div>

                                <div className="flex bg-black/45 p-1 rounded-full border border-white/10 gap-1 overflow-x-auto max-w-full">
                                    <button 
                                        onClick={() => setFullscreenDevice('widescreen')}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${fullscreenDevice === 'widescreen' ? 'bg-[#C9A236] text-black' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        🖥️ Widescreen
                                    </button>
                                    <button 
                                        onClick={() => setFullscreenDevice('desktop')}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${fullscreenDevice === 'desktop' ? 'bg-[#C9A236] text-black' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        Desktop
                                    </button>
                                    <button 
                                        onClick={() => setFullscreenDevice('tablet')}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${fullscreenDevice === 'tablet' ? 'bg-[#C9A236] text-black' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        Tablet
                                    </button>
                                    <button 
                                        onClick={() => setFullscreenDevice('mobile')}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${fullscreenDevice === 'mobile' ? 'bg-[#C9A236] text-black' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        Phone
                                    </button>
                                </div>

                                {['mobile', 'tablet'].includes(fullscreenDevice) && (
                                    <div className="flex bg-black/45 p-1 rounded-full border border-white/10 gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => setOrientation('portrait')}
                                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${orientation === 'portrait' ? 'bg-[#DFCFAF] text-[#0A2922]' : 'text-gray-300 hover:text-white'}`}
                                            title="Simulate vertical portrait orientation"
                                        >
                                            📐 Portrait
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setOrientation('landscape')}
                                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${orientation === 'landscape' ? 'bg-[#DFCFAF] text-[#0A2922]' : 'text-gray-300 hover:text-white'}`}
                                            title="Simulate horizontal landscape orientation"
                                        >
                                            📟 Landscape
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Immersive Sandbox view box container center */}
                        <div className="flex-1 flex items-center justify-center py-6 w-full max-h-[70vh] overflow-hidden">
                            <div 
                                ref={interactiveCanvasRef}
                                onMouseDown={handleCanvasMouseDown}
                                onTouchStart={handleCanvasTouchStart}
                                onMouseMove={handleCanvasMouseMove}
                                onTouchMove={handleCanvasTouchMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                onTouchEnd={handleCanvasMouseUp}
                                className={`transition-all duration-300 ease-in-out border-4 border-[#DFCFAF]/40 shadow-2xl relative rounded-3xl overflow-hidden flex flex-col items-center justify-center select-none ${
                                    previewMode === 'replica' && activeTab === 'carousel' && (bannerForm.button_link_context?.image_mode === 'bg_over_content' || !bannerForm.button_link_context?.container_aspect || bannerForm.button_link_context?.container_aspect === 'default' || bannerForm.button_link_context?.container_aspect === 'auto' || bannerForm.button_link_context?.container_aspect === 'custom')
                                        ? 'h-auto w-full'
                                        : previewMode === 'replica' && activeTab === 'carousel' && bannerForm.button_link_context?.container_aspect && bannerForm.button_link_context?.container_aspect !== 'default' && bannerForm.button_link_context?.container_aspect !== 'auto'
                                            ? (
                                                bannerForm.button_link_context.container_aspect === 'aspect-21/7' ? 'w-full max-w-5xl aspect-[21/7]' :
                                                bannerForm.button_link_context.container_aspect === 'aspect-16/9' ? 'w-full max-w-4xl aspect-[16/9]' :
                                                bannerForm.button_link_context.container_aspect === 'aspect-4/3' ? 'w-full max-w-2xl aspect-[4/3]' :
                                                bannerForm.button_link_context.container_aspect === 'aspect-1/1' ? 'w-full max-w-md aspect-[1/1]' :
                                                'w-full max-w-5xl aspect-[21/9]'
                                            ) : (
                                                fullscreenDevice === 'widescreen' ? 'w-full max-w-5xl aspect-[21/9]' :
                                                fullscreenDevice === 'desktop' ? 'w-full max-w-4xl aspect-[16/9]' :
                                                fullscreenDevice === 'tablet' ? (orientation === 'portrait' ? 'w-[450px] aspect-[3/4]' : 'w-[680px] aspect-[4/3]') :
                                                (orientation === 'portrait' ? 'w-[310px] aspect-[9/16]' : 'w-[550px] aspect-[16/9]')
                                            )
                                } ${
                                    previewMode === 'replica' && activeTab === 'carousel'
                                        ? (bannerForm.color_scheme === 'beige' ? 'bg-[#FCF2D5] text-[#0F4A3C]' : 'bg-[#0F4A3C] text-[#FCF2D5]')
                                        : 'bg-[#042019] text-[#FCF2D5]'
                                }`}
                                style={{
                                    backgroundImage: activeTab === 'carousel' && previewMode !== 'replica' && (bannerForm.button_link_context?.image_mode === 'bg' || !bannerForm.button_link_context?.image_mode) && activePreviewImageUrl 
                                        ? `url(${activePreviewImageUrl})` 
                                        : 'none',
                                    backgroundSize: bannerForm.button_link_context?.bg_fit || 'cover',
                                    backgroundRepeat: bannerForm.button_link_context?.bg_fit === 'contain' ? 'no-repeat' : undefined,
                                    backgroundPosition: 'center',
                                    height: previewMode === 'replica' && activeTab === 'carousel' && bannerForm.button_link_context?.container_aspect === 'custom' && bannerForm.button_link_context?.custom_height
                                        ? bannerForm.button_link_context.custom_height
                                        : undefined,
                                    maxWidth: previewMode === 'replica' && activeTab === 'carousel' && bannerForm.button_link_context?.container_aspect === 'custom' && bannerForm.button_link_context?.custom_width
                                        ? bannerForm.button_link_context.custom_width
                                        : undefined
                                }}
                            >
                                {/* Invisible sizing template image to force the container height to perfectly match the current background image! */}
                                {(bannerForm.button_link_context?.image_mode === 'bg_over_content' || !bannerForm.button_link_context?.container_aspect || bannerForm.button_link_context?.container_aspect === 'default' || bannerForm.button_link_context?.container_aspect === 'auto') && activePreviewImageUrl && (
                                    <img 
                                        src={activePreviewImageUrl}
                                        alt="Replica Preview size reference"
                                        className="w-full h-auto opacity-0 pointer-events-none block"
                                        referrerPolicy="no-referrer"
                                    />
                                )}

                                {/* Active Click & Draw Guide/Highlights overlays */}
                                {isDrawingMode && (
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#0A2922]/95 border border-[#C9A236]/50 rounded-full px-4 py-1.5 shadow-2xl z-40 flex items-center gap-3 pointer-events-none animate-pulse">
                                        <span className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                            📐 Drag box on background to draw hotspot
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsDrawingMode(false);
                                            }}
                                            className="pointer-events-auto text-[8px] font-black text-red-300 hover:text-red-400 uppercase bg-black/30 px-2 py-0.5 rounded-full border border-red-500/20 font-sans"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {isDrawingMode && drawStart && drawCurrent && (() => {
                                    const minX = Math.min(drawStart.x, drawCurrent.x);
                                    const maxX = Math.max(drawStart.x, drawCurrent.x);
                                    const minY = Math.min(drawStart.y, drawCurrent.y);
                                    const maxY = Math.max(drawStart.y, drawCurrent.y);
                                    const w = maxX - minX;
                                    const h = maxY - minY;
                                    return (
                                        <div 
                                            className="absolute z-50 border-2 border-[#C9A236] border-dashed bg-[#C9A236]/25 pointer-events-none flex items-center justify-center font-bold text-center text-[10px] text-white font-sans"
                                            style={{
                                                left: `${minX}%`,
                                                top: `${minY}%`,
                                                width: `${w}%`,
                                                height: `${h}%`
                                            }}
                                        >
                                            <span className="bg-black/80 text-[#DFCFAF] border border-[#C9A236]/20 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider font-extrabold uppercase">
                                                📐 Drawing Hotspot... ({Math.round(w)}% x {Math.round(h)}%)
                                            </span>
                                        </div>
                                    );
                                })()}

                                {previewMode === 'replica' ? (
                                    activeTab === 'shelf' ? (
                                        <>
                                            {/* Exact replica of the Moving Shelf */}
                                            <div className="absolute inset-x-0 bottom-1/4 h-2.5 bg-black/5 w-full flex overflow-hidden opacity-10 pointer-events-none"></div>
                                            
                                            <div className="text-center z-10 max-w-sm pointer-events-none select-none">
                                                <h1 className={`${
                                                    fullscreenDevice === 'mobile' ? 'text-lg' : 'text-3xl'
                                                } font-serif font-black text-hav-gold tracking-tight leading-snug drop-shadow-xl`}>
                                                    {renderPreviewUnderline(shelfConfig.line1)} <br />
                                                    {renderPreviewUnderline(shelfConfig.line2)}
                                                </h1>
                                            </div>

                                            {/* Clean Replica Button 1 */}
                                            {shelfConfig.btn1Text && (
                                                <div 
                                                    className="absolute z-20 pb-2 pointer-events-none select-none"
                                                    style={{
                                                        left: `${shelfConfig.btn1_x ?? 40}%`,
                                                        top: `${shelfConfig.btn1_y ?? 78}%`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                >
                                                    <div 
                                                        className="px-6 py-3 font-black uppercase text-[9px] tracking-widest shadow-lg border select-none transition-all duration-200"
                                                        style={{
                                                            backgroundColor: shelfConfig.btn1BgColor || '#C9A236',
                                                            color: shelfConfig.btn1TextColor || '#0F4A3C',
                                                            borderColor: shelfConfig.btn1BorderColor || 'transparent',
                                                            borderWidth: shelfConfig.btn1BorderColor ? '2px' : '0px',
                                                            borderRadius: shelfConfig.btn1BorderRadius === 'sharp' ? '0px' :
                                                                          shelfConfig.btn1BorderRadius === 'rounded-sm' ? '4px' :
                                                                          shelfConfig.btn1BorderRadius === 'rounded font-black' ? '8px' :
                                                                          shelfConfig.btn1BorderRadius === 'rounded-xl' ? '14px' : '9999px'
                                                        }}
                                                    >
                                                        <span>{shelfConfig.btn1Text}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Clean Replica Button 2 */}
                                            {shelfConfig.btn2Text && (
                                                <div 
                                                    className="absolute z-20 pb-2 pointer-events-none select-none"
                                                    style={{
                                                        left: `${shelfConfig.btn2_x ?? 60}%`,
                                                        top: `${shelfConfig.btn2_y ?? 78}%`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                >
                                                    <div 
                                                        className="px-6 py-3 font-black uppercase text-[9px] tracking-widest shadow-lg border select-none transition-all duration-200"
                                                        style={{
                                                            backgroundColor: shelfConfig.btn2BgColor || '#000000',
                                                            color: shelfConfig.btn2TextColor || '#C9A236',
                                                            borderColor: shelfConfig.btn2BorderColor || 'transparent',
                                                            borderWidth: shelfConfig.btn2BorderColor ? '2px' : '0px',
                                                            borderRadius: shelfConfig.btn2BorderRadius === 'sharp' ? '0px' :
                                                                          shelfConfig.btn2BorderRadius === 'rounded-sm' ? '4px' :
                                                                          shelfConfig.btn2BorderRadius === 'rounded font-black' ? '8px' :
                                                                          shelfConfig.btn2BorderRadius === 'rounded-xl' ? '14px' : '9999px'
                                                        }}
                                                    >
                                                        <span>{shelfConfig.btn2Text}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className={`absolute inset-0 flex ${(fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet') ? 'flex-col p-4 justify-center' : 'flex-col md:flex-row p-4 md:p-12'} items-center justify-center w-full h-full relative overflow-hidden animate-fade-in`}>
                                            {/* Glow Blob */}
                                            <div 
                                                className="absolute w-2/3 h-2/3 rounded-full blur-[60px] pointer-events-none opacity-40"
                                                style={{
                                                    top: '50%',
                                                    left: '25%',
                                                    transform: 'translate(-30%, -40%)',
                                                    background: bannerForm.color_scheme === 'beige' ? 'radial-gradient(circle, rgba(15,74,60,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(201,162,54,0.15) 0%, transparent 70%)'
                                                }}
                                            />

                                            {/* Full Background Mode & Background Over Content Mode */}
                                            {(bannerForm.button_link_context?.image_mode === 'bg' || bannerForm.button_link_context?.image_mode === 'bg_over_content') && (() => {
                                                const bgFit = bannerForm.button_link_context?.bg_fit || 'cover';
                                                const brightnessVal = bannerForm.button_link_context?.bg_brightness !== undefined ? bannerForm.button_link_context.bg_brightness : 100;
                                                
                                                if (activePreviewImageUrl) {
                                                    if (bannerForm.button_link_context?.image_mode === 'bg_over_content') {
                                                        return (
                                                            <img 
                                                                src={activePreviewImageUrl} 
                                                                alt="Background Banner"
                                                                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                                                                style={{ 
                                                                    filter: `brightness(${brightnessVal}%)`,
                                                                    objectFit: bgFit as any
                                                                }}
                                                                referrerPolicy="no-referrer"
                                                            />
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <div 
                                                            className="absolute inset-0 bg-center select-none"
                                                            style={{ 
                                                                backgroundImage: `url(${activePreviewImageUrl})`,
                                                                backgroundSize: bgFit,
                                                                backgroundRepeat: bgFit === 'contain' ? 'no-repeat' : undefined,
                                                                filter: `brightness(${brightnessVal}%)`
                                                            }}
                                                        />
                                                    );
                                                } else {
                                                    return (
                                                        <div className="absolute inset-x-4 inset-y-4 select-none bg-[#0A2922]/40 border-2 border-dashed border-[#DFCFAF]/20 rounded-2xl flex items-center justify-center">
                                                            <div className="text-center opacity-40">
                                                                <span className="text-[12px] uppercase tracking-widest font-black block text-[#DFCFAF]/70">🌅 Background Image Area</span>
                                                                <span className="text-[8px] text-[#DFCFAF]/50">Image will stretch full-screen behind the typography layout</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })()}

                                            {/* Dimmer overlay */}
                                            <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: (bannerForm.overlay_opacity || 0) / 100 }}></div>

                                            {/* Floating Draggable mode */}
                                            {bannerForm.button_link_context?.image_mode === 'draggable' && (
                                                activePreviewImageUrl ? (
                                                    <div
                                                        className="absolute z-20 pointer-events-none select-none drop-shadow-2xl w-max min-w-max"
                                                        style={{
                                                            left: `${getLayoutValue('image_x', 50)}%`,
                                                            top: `${getLayoutValue('image_y', 50)}%`,
                                                            transform: `translate(-50%, -50%) scale(${(getLayoutValue('image_scale', 100)) / 100})`,
                                                        }}
                                                    >
                                                        <img 
                                                            src={activePreviewImageUrl} 
                                                            alt="Movable sliding asset"
                                                            className="max-h-[220px] md:max-h-[280px] w-auto object-contain"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="absolute z-20 select-none border border-dashed border-[#C9A236]/40 bg-[#0A2922]/90 px-4 py-2.5 rounded-xl flex flex-col items-center justify-center p-2 text-center"
                                                        style={{
                                                            left: `${getLayoutValue('image_x', 50)}%`,
                                                            top: `${getLayoutValue('image_y', 50)}%`,
                                                            transform: `translate(-50%, -50%)`,
                                                        }}
                                                    >
                                                        <span className="text-[9px] font-bold text-[#DFCFAF] uppercase tracking-widest">🕹️ Draggable Asset Grid</span>
                                                        <span className="text-[7px] text-[#DFCFAF]/60 mt-0.5">Define image URL to place your asset here</span>
                                                    </div>
                                                )
                                            )}

                                            {/* Split mode / empty mode */}
                                            {(bannerForm.button_link_context?.image_mode === 'split' || !bannerForm.button_link_context?.image_mode) && (
                                                <div className={(fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet') ? "w-full h-[45%] flex items-center justify-center p-2 order-1 z-10" : "w-full md:w-1/2 h-[45%] md:h-full flex items-center justify-center p-2 order-1 z-10"}>
                                                    {activePreviewImageUrl ? (
                                                        <img 
                                                            src={activePreviewImageUrl} 
                                                            alt="Product asset" 
                                                            className="max-h-full max-w-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="w-11/12 h-5/6 border-2 border-dashed border-[#DFCFAF]/20 rounded-2xl flex flex-col items-center justify-center p-4 bg-black/15 text-center">
                                                            <div className="text-xl mb-1.5 opacity-70">🖼️</div>
                                                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#DFCFAF]/70">No Image Specified</span>
                                                            <span className="text-[8px] text-[#DFCFAF]/50 mt-1 max-w-[200px] leading-relaxed">Add a standard fallback URL or upload an image on the left side menu.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Content Block */}
                                            {!bannerForm.button_link_context?.text_custom && !hideText && (
                                                <div 
                                                    className={`flex flex-col justify-center order-2 z-10 w-full ${(fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet') ? "h-[55%] items-center text-center px-4" : "h-[55%] md:h-full"} ${
                                                        !(fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet') && (bannerForm.button_link_context?.image_mode === 'split' || !bannerForm.button_link_context?.image_mode)
                                                            ? "md:w-1/2 items-center md:items-start text-center md:text-left px-4"
                                                            : "items-center text-center px-6"
                                                    }`}
                                                >
                                                    <h2 className={`font-serif font-black leading-tight mb-3 drop-shadow-md tracking-tight ${
                                                        bannerForm.color_scheme === 'beige' ? 'text-[#0F4A3C]' : 'text-hav-gold'
                                                    } ${
                                                        fullscreenDevice === 'mobile' ? 'text-lg mb-1' : 'text-3xl md:text-5xl lg:text-6xl'
                                                    }`}>
                                                        {bannerForm.title || "Premium Headline"}
                                                    </h2>
                                                    
                                                    <p className={`font-light leading-relaxed mb-6 drop-shadow-sm max-w-md ${
                                                        bannerForm.color_scheme === 'beige' ? 'text-[#0F4A3C]/85' : 'text-white/85'
                                                    } ${
                                                        fullscreenDevice === 'mobile' ? 'text-[10px] mb-3 leading-snug' : 'text-xs md:text-md'
                                                    }`}>
                                                        {bannerForm.subtitle || "Customize subtext contents beautifully on screen."}
                                                    </p>

                                                    {/* Rendering buttons cleanly */}
                                                    {!bannerForm.button_link_context?.custom_position && (
                                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                                            {(bannerForm.button_link_context?.buttons || []).map((btn: any) => (
                                                                <div
                                                                    key={btn.id}
                                                                    className="px-4 py-2 font-black uppercase text-[9px] tracking-wider shadow-md whitespace-nowrap active:scale-95 transition-all duration-150 border cursor-pointer hover:opacity-90"
                                                                    style={{
                                                                        backgroundColor: btn.bg_color || '#C9A236',
                                                                        color: btn.text_color || '#0F4A3C',
                                                                        borderColor: btn.border_color || 'transparent',
                                                                        borderWidth: btn.border_color ? '2px' : '0px',
                                                                        borderRadius: btn.border_radius === 'sharp' ? '0px' :
                                                                                      btn.border_radius === 'rounded-sm' ? '4px' :
                                                                                      btn.border_radius === 'rounded font-black' ? '8px' :
                                                                                      btn.border_radius === 'rounded-xl' ? '14px' : '9999px'
                                                                    }}
                                                                >
                                                                    {btn.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Absolute Text Overlay for Replica Mode */}
                                            {bannerForm.button_link_context?.text_custom && !hideText && (
                                                <div 
                                                    className={`absolute z-10 p-4 max-w-sm w-full select-none flex flex-col pointer-events-none ${
                                                        bannerForm.text_alignment === 'center' ? 'items-center text-center' :
                                                        bannerForm.text_alignment === 'right' ? 'items-end text-right' :
                                                        'items-start text-left'
                                                    }`}
                                                    style={{
                                                        left: `${getLayoutValue('text_x', 50)}%`,
                                                        top: `${getLayoutValue('text_y', 40)}%`,
                                                        transform: `translate(-50%, -50%) scale(${(getLayoutValue('text_scale', 100)) / 100})`,
                                                    }}
                                                >
                                                    <h2 className={`font-serif font-black leading-tight mb-3 drop-shadow-md tracking-tight ${
                                                        bannerForm.color_scheme === 'beige' ? 'text-[#0F4A3C]' : 'text-hav-gold'
                                                    } ${
                                                        fullscreenDevice === 'mobile' ? 'text-lg mb-1' : 'text-3xl md:text-5xl lg:text-6xl'
                                                    }`}>
                                                        {bannerForm.title || "Premium Headline"}
                                                    </h2>
                                                    <p className={`font-light leading-relaxed drop-shadow-sm max-w-md ${
                                                        bannerForm.color_scheme === 'beige' ? 'text-[#0F4A3C]/85' : 'text-white/85'
                                                    } ${
                                                        fullscreenDevice === 'mobile' ? 'text-[10px] leading-snug' : 'text-xs md:text-md'
                                                    }`}>
                                                        {bannerForm.subtitle || "Customize subtext contents beautifully on screen."}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Custom Absolute Positioned Buttons for Replica Mode */}
                                            {(bannerForm.button_link_context?.buttons || []).map((btn: any) => {
                                                const isAbsoluteBtn = !!bannerForm.button_link_context?.custom_position;
                                                 const isHotspot = !!btn.is_hotspot;
                                                // Render absolute positioned buttons if custom_position is active to match frontend carousel exactly
                                                if (!isAbsoluteBtn) return null;
                                                const coords = getLayoutButtonCoordinates(btn.id, btn.x !== undefined ? btn.x : 50, btn.y !== undefined ? btn.y : 80, btn.scale);
                                                return (
                                                    <div
                                                        key={btn.id}
                                                        className={`absolute z-20 font-black uppercase text-[9px] tracking-wider shadow-md whitespace-nowrap border pointer-events-none flex items-center justify-center text-center overflow-hidden ${isHotspot ? 'border-dashed border-[#C9A236]' : ''}`}
                                                        style={{
                                                            left: `${coords.x}%`,
                                                            top: `${coords.y}%`,
                                                            transform: `translate(-50%, -50%) scale(${(coords.scale) / 100})`,
                                                            width: coords.width && coords.width > 0 ? `${coords.width}px` : 'auto',
                                                            height: coords.height && coords.height > 0 ? `${coords.height}px` : 'auto',
                                                            backgroundColor: isHotspot ? 'rgba(0,0,0,0.45)' : (btn.bg_color || '#C9A236'),
                                                            color: isHotspot ? '#C9A236' : (btn.text_color || '#0F4A3C'),
                                                            borderColor: isHotspot ? '#C9A236' : (btn.border_color || 'transparent'),
                                                            borderWidth: isHotspot ? '1.5px' : (btn.border_color ? '2px' : '0px'),
                                                            borderRadius: btn.border_radius === 'sharp' ? '0px' :
                                                                          btn.border_radius === 'rounded-sm' ? '4px' :
                                                                          btn.border_radius === 'rounded font-black' ? '8px' :
                                                                          btn.border_radius === 'rounded' ? '8px' :
                                                                          btn.border_radius === 'rounded-xl' ? '14px' : '9999px'
                                                        }}
                                                     >
                                                        <span className={`${coords.width && coords.width > 0 ? 'px-2 py-1' : 'px-4 py-2'} block truncate`}>
                                                             {isHotspot ? `🔲 ${btn.text || 'Hotspot'}` : btn.text}
                                                         </span>
                                                    </div>
                                                );
                                            })}

                                            {/* Connected Product Badges */}
                                            {bannerForm.button_link_context?.product_id && bannerForm.button_link_context?.show_product_badge && (() => {
                                                const pId = bannerForm.button_link_context.product_id;
                                                const p = products.find(prod => prod.id === pId);
                                                if (!p) return null;
                                                return (
                                                    <div className={`absolute z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-hav-gold/25 p-3 shadow-2xl text-gray-900 flex items-center gap-2 select-none ${
                                                        fullscreenDevice === 'mobile' ? 'bottom-2 right-2 max-w-[140px]' : 'bottom-6 right-6 max-w-[200px]'
                                                    }`}>
                                                        <img 
                                                            src={p.image_urls?.[0]} 
                                                            alt={p.name} 
                                                            className={`${fullscreenDevice === 'mobile' ? 'w-7 h-7' : 'w-10 h-10'} object-cover rounded-lg border border-gray-100 shrink-0`} 
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        <div className="flex-1 text-left min-w-0">
                                                            <h4 className={`font-serif font-black text-hav-forest truncate leading-tight ${fullscreenDevice === 'mobile' ? 'text-[7px]' : 'text-[9px]'}`}>
                                                                {p.name}
                                                            </h4>
                                                            <div className="flex items-center justify-between gap-1 mt-0.5 animate-fade-in">
                                                                <span className={`font-black text-hav-forest ${fullscreenDevice === 'mobile' ? 'text-[8px]' : 'text-[9px]'}`}>
                                                                    ₹{p.product_variants?.[0]?.price || 350}
                                                                </span>
                                                                <span className="bg-hav-gold/15 text-hav-forest font-black text-[6px] px-1 py-0.5 rounded uppercase font-sans">
                                                                    Linked
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )
                                ) : (
                                    activeTab === 'shelf' ? (
                                        <>
                                            {/* Underlined moving shelf context inside centered */}
                                            <div className="absolute inset-x-0 bottom-1/4 h-2.5 bg-black/10 w-full flex overflow-hidden opacity-10 pointer-events-none"></div>
                                            
                                            <div className="text-center z-10 max-w-sm pointer-events-none select-none">
                                                <h1 className={`${
                                                    fullscreenDevice === 'mobile' ? 'text-lg' : 'text-3xl'
                                                } font-serif font-black text-hav-gold tracking-tight leading-snug drop-shadow-xl`}>
                                                    {renderPreviewUnderline(shelfConfig.line1)} <br />
                                                    {renderPreviewUnderline(shelfConfig.line2)}
                                                </h1>
                                            </div>

                                            {/* Draggable Button 1 */}
                                            {shelfConfig.btn1Text && (
                                                <div 
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingShelfBtn(1);
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingShelfBtn(1);
                                                    }}
                                                    className={`absolute cursor-grab active:cursor-grabbing z-30 select-none pb-2 ${draggingShelfBtn === 1 ? 'scale-105 ring-2 ring-[#C9A236]' : ''}`}
                                                    style={{
                                                        left: `${shelfConfig.btn1_x ?? 40}%`,
                                                        top: `${shelfConfig.btn1_y ?? 78}%`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                >
                                                    <div 
                                                        className="px-5 py-2.5 font-black uppercase text-[8px] tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.5)] border select-none flex items-center gap-1.5 whitespace-nowrap transition-all duration-200"
                                                        style={{
                                                            backgroundColor: shelfConfig.btn1BgColor || '#C9A236',
                                                            color: shelfConfig.btn1TextColor || '#0F4A3C',
                                                            borderColor: shelfConfig.btn1BorderColor || 'transparent',
                                                            borderWidth: shelfConfig.btn1BorderColor ? '2px' : '0px',
                                                            borderRadius: shelfConfig.btn1BorderRadius === 'sharp' ? '0px' :
                                                                          shelfConfig.btn1BorderRadius === 'rounded-sm' ? '4px' :
                                                                          shelfConfig.btn1BorderRadius === 'rounded' ? '8px' :
                                                                          shelfConfig.btn1BorderRadius === 'rounded-xl' ? '14px' : '9999px'
                                                        }}
                                                    >
                                                        <span>🎯 {shelfConfig.btn1Text}</span>
                                                        <span className="text-[6px] opacity-75 bg-black/40 text-white px-1.5 py-0.5 rounded font-sans font-black">HELD DRAG</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Draggable Button 2 */}
                                            {shelfConfig.btn2Text && (
                                                <div 
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingShelfBtn(2);
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingShelfBtn(2);
                                                    }}
                                                    className={`absolute cursor-grab active:cursor-grabbing z-30 select-none pb-2 ${draggingShelfBtn === 2 ? 'scale-105 ring-2 ring-[#C9A236]' : ''}`}
                                                    style={{
                                                        left: `${shelfConfig.btn2_x ?? 60}%`,
                                                        top: `${shelfConfig.btn2_y ?? 78}%`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                >
                                                    <div 
                                                        className="px-5 py-2.5 font-black uppercase text-[8px] tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.5)] border select-none flex items-center gap-1.5 whitespace-nowrap transition-all duration-200"
                                                        style={{
                                                            backgroundColor: shelfConfig.btn2BgColor || '#000000',
                                                            color: shelfConfig.btn2TextColor || '#C9A236',
                                                            borderColor: shelfConfig.btn2BorderColor || 'transparent',
                                                            borderWidth: shelfConfig.btn2BorderColor ? '2px' : '0px',
                                                            borderRadius: shelfConfig.btn2BorderRadius === 'sharp' ? '0px' :
                                                                          shelfConfig.btn2BorderRadius === 'rounded-sm' ? '4px' :
                                                                          shelfConfig.btn2BorderRadius === 'rounded' ? '8px' :
                                                                          shelfConfig.btn2BorderRadius === 'rounded-xl' ? '14px' : '9999px'
                                                        }}
                                                    >
                                                        <span>🎯 {shelfConfig.btn2Text}</span>
                                                        <span className="text-[6px] opacity-75 bg-black/40 text-white px-1.5 py-0.5 rounded font-sans font-black">HELD DRAG</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Overlay intensity contrast */}
                                            <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: (bannerForm.overlay_opacity || 0) / 100 }}></div>

                                            {/* Restore Hiding Text Overlay button */}
                                            {hideText && (
                                                <div className="absolute top-4 left-4 z-40 bg-black/75 p-1 rounded-lg border border-white/10 shadow-lg pointer-events-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateLayoutValue('hide_text', false)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A236] hover:bg-[#DFCFAF] text-black text-[9px] font-black uppercase tracking-wider transition-all shadow-md font-sans cursor-pointer whitespace-nowrap"
                                                    >
                                                        ➕ RESTORE TEXT OVERLAY (Hidden)
                                                    </button>
                                                </div>
                                            )}

                                            {/* Split image preview layout */}
                                            {bannerForm.button_link_context?.image_mode === 'split' && activePreviewImageUrl && (
                                                <div className={(fullscreenDevice === 'mobile' || fullscreenDevice === 'tablet')
                                                    ? "absolute inset-x-0 top-0 w-full h-[45%] bg-[#031510]/55 flex items-center justify-center p-4 border-b border-white/5 pointer-events-none select-none"
                                                    : "absolute inset-y-0 left-0 w-1/2 h-full bg-[#031510]/55 flex items-center justify-center p-4 border-r border-white/5 pointer-events-none select-none"
                                                }>
                                                    <img 
                                                        src={activePreviewImageUrl} 
                                                        alt="Split product graphic" 
                                                        className="max-h-full max-w-full object-contain drop-shadow-2xl" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                </div>
                                            )}

                                            {/* Draggable overlay graphic mode */}
                                            {bannerForm.button_link_context?.image_mode === 'draggable' && activePreviewImageUrl && (
                                                <div
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingImage(true);
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingImage(true);
                                                     }}
                                                    className={`absolute cursor-grab active:cursor-grabbing z-20 select-none pb-2 ${isDrawingMode ? 'pointer-events-none opacity-40' : ''} ${draggingImage ? 'scale-[1.03] ring-1 ring-[#C9A236]' : 'hover:outline-dashed hover:outline-[#C9A236]/40'} w-max min-w-max flex flex-col items-center justify-center`}
                                                    style={{
                                                        left: `${getLayoutValue('image_x', 50)}%`,
                                                        top: `${getLayoutValue('image_y', 50)}%`,
                                                        transform: `translate(-50%, -50%) scale(${(getLayoutValue('image_scale', 100)) / 100})`,
                                                     }}
                                                >
                                                     <img 
                                                        src={activePreviewImageUrl} 
                                                        alt="Movable Graphic element" 
                                                        className="w-auto max-h-[170px] pointer-events-none object-contain"
                                                        referrerPolicy="no-referrer"
                                                     />
                                                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-[6px] tracking-wide text-white px-2 py-0.5 rounded font-black whitespace-nowrap opacity-80 border border-white/10 shadow-lg pointer-events-none">
                                                          🖼️ DRAG GRAPHIC
                                                     </div>

                                                     {/* 4 Handles for Symmetrical Resizing */}
                                                     {['nw', 'ne', 'sw', 'se'].map((dir) => {
                                                         const posClass = 
                                                             dir === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' :
                                                             dir === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' :
                                                             dir === 'sw' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' :
                                                             '-bottom-1.5 -right-1.5 cursor-nwse-resize';
                                                         return (
                                                             <div
                                                                 key={dir}
                                                                 onMouseDown={(e) => {
                                                                     e.stopPropagation();
                                                                     e.preventDefault();
                                                                     
                                                                     const container = e.currentTarget.parentElement;
                                                                     if (container) {
                                                                         const rect = container.getBoundingClientRect();
                                                                         const centerX = rect.left + rect.width / 2;
                                                                         const centerY = rect.top + rect.height / 2;
                                                                         const initialDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
                                                                         
                                                                         setIsResizingImage(true);
                                                                         resizeStartRef.current = {
                                                                             centerX,
                                                                             centerY,
                                                                             initialDistance: initialDistance || 1,
                                                                             initialScale: getLayoutValue('image_scale', 100)
                                                                         };
                                                                     }
                                                                 }}
                                                                 onTouchStart={(e) => {
                                                                     e.stopPropagation();
                                                                     const touch = e.touches[0];
                                                                     if (touch) {
                                                                         const container = e.currentTarget.parentElement;
                                                                         if (container) {
                                                                             const rect = container.getBoundingClientRect();
                                                                             const centerX = rect.left + rect.width / 2;
                                                                             const centerY = rect.top + rect.height / 2;
                                                                             const initialDistance = Math.hypot(touch.clientX - centerX, touch.clientY - centerY);
                                                                             
                                                                             setIsResizingImage(true);
                                                                             resizeStartRef.current = {
                                                                                 centerX,
                                                                                 centerY,
                                                                                 initialDistance: initialDistance || 1,
                                                                                 initialScale: getLayoutValue('image_scale', 100)
                                                                             };
                                                                         }
                                                                     }
                                                                 }}
                                                                 className={`absolute w-3.5 h-3.5 bg-yellow-500 hover:bg-yellow-400 border border-black rounded-full z-30 shadow-lg flex items-center justify-center text-[7px] pointer-events-auto select-none ${posClass}`}
                                                                 title="Drag to resize"
                                                             >
                                                                 {dir === 'se' ? '📐' : ''}
                                                             </div>
                                                         );
                                                     })}
                                                </div>
                                            )}

                                            {/* Draggable Overlay typography */}
                                            {!hideText && (bannerForm.button_link_context?.text_custom ? (
                                                <div 
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingText(true);
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingText(true);
                                                    }}
                                                    className={`absolute cursor-grab active:cursor-grabbing z-10 p-4 max-w-sm w-full select-none pb-2 flex flex-col ${isDrawingMode ? 'pointer-events-none opacity-40' : ''} ${
                                                        draggingText ? 'scale-[1.02] ring-1 ring-[#C9A236]/70 bg-black/35 rounded-lg' : 'hover:outline-dashed hover:outline-[#C9A236]/30 hover:bg-black/25 rounded-lg'
                                                    } ${
                                                        bannerForm.text_alignment === 'center' ? 'items-center text-center' :
                                                        bannerForm.text_alignment === 'right' ? 'items-end text-right' :
                                                        'items-start text-left'
                                                    }`}
                                                    style={{
                                                        left: `${getLayoutValue('text_x', 50)}%`,
                                                        top: `${getLayoutValue('text_y', 40)}%`,
                                                        transform: `translate(-50%, -50%) scale(${(getLayoutValue('text_scale', 100)) / 100})`,
                                                    }}
                                                >
                                                    <h2 
                                                        contentEditable={!isDrawingMode}
                                                        suppressContentEditableWarning={true}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onBlur={(e) => {
                                                            const val = e.currentTarget.textContent || "";
                                                            setBannerForm((p: any) => ({
                                                                ...p,
                                                                title: val
                                                            }));
                                                        }}
                                                        className={`font-serif font-black text-hav-gold leading-tight mb-2 outline-none focus:ring-2 focus:ring-[#C9A236] px-1 rounded cursor-text ${
                                                            fullscreenDevice === 'mobile' ? 'text-lg' : 'text-3xl'
                                                        }`}
                                                    >
                                                        {bannerForm.title || "Premium Headline overlay"}
                                                    </h2>
                                                    <p 
                                                        contentEditable={!isDrawingMode}
                                                        suppressContentEditableWarning={true}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onBlur={(e) => {
                                                            const val = e.currentTarget.textContent || "";
                                                            setBannerForm((p: any) => ({
                                                                ...p,
                                                                subtitle: val
                                                            }));
                                                        }}
                                                        className={`text-white/80 font-light outline-none focus:ring-2 focus:ring-[#C9A236]/80 px-1 rounded cursor-text ${
                                                            fullscreenDevice === 'mobile' ? 'text-[9px] leading-snug' : 'text-xs leading-relaxed'
                                                        }`}
                                                    >
                                                        {bannerForm.subtitle || "Customize subtext coordinates dynamically using full view sandbox controls."}
                                                    </p>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-[6px] tracking-wide text-white px-2 py-0.5 rounded font-black whitespace-nowrap opacity-80 border border-white/10 shadow-lg">
                                                        ✍️ DRAG TEXT BLOCK
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setDraggingText(true);
                                                        setBannerForm((prev: any) => ({
                                                            ...prev,
                                                            button_link_context: {
                                                                ...prev.button_link_context,
                                                                text_custom: true,
                                                                text_x: 50,
                                                                text_y: 40,
                                                                text_scale: 100
                                                            }
                                                        }));
                                                    }}
                                                    className={`absolute z-10 p-6 max-w-sm w-full flex flex-col select-none cursor-grab active:cursor-grabbing hover:outline-dashed hover:outline-[#C9A236]/20 hover:bg-black/10 rounded-xl ${isDrawingMode ? 'pointer-events-none opacity-40' : ''} ${
                                                        bannerForm.button_link_context?.image_mode === 'split' ? 'right-4 left-auto top-1/2 -translate-y-1/2' : 'left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2'
                                                    } ${
                                                        bannerForm.text_alignment === 'center' ? 'items-center text-center' :
                                                        bannerForm.text_alignment === 'right' ? 'items-end text-right' :
                                                        'items-start text-left'
                                                    }`}
                                                >
                                                    <h2 
                                                        contentEditable={!isDrawingMode}
                                                        suppressContentEditableWarning={true}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onBlur={(e) => {
                                                            const val = e.currentTarget.textContent || "";
                                                            setBannerForm((p: any) => ({
                                                                ...p,
                                                                title: val
                                                            }));
                                                        }}
                                                        className={`font-serif font-black text-hav-gold leading-tight mb-2 outline-none focus:ring-2 focus:ring-[#C9A236] px-1 rounded cursor-text ${
                                                            fullscreenDevice === 'mobile' ? 'text-lg' : 'text-3xl font-bold'
                                                        }`}
                                                    >
                                                        {bannerForm.title || "Premium Headline overlay"}
                                                    </h2>
                                                    <p 
                                                        contentEditable={!isDrawingMode}
                                                        suppressContentEditableWarning={true}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onBlur={(e) => {
                                                            const val = e.currentTarget.textContent || "";
                                                            setBannerForm((p: any) => ({
                                                                ...p,
                                                                subtitle: val
                                                            }));
                                                        }}
                                                        className={`text-white/80 font-light outline-none focus:ring-2 focus:ring-[#C9A236]/80 px-1 rounded cursor-text ${
                                                            fullscreenDevice === 'mobile' ? 'text-[9px] leading-snug' : 'text-xs leading-relaxed'
                                                        }`}
                                                    >
                                                        {bannerForm.subtitle || "Customize subtext coordinates dynamically using full view sandbox controls."}
                                                    </p>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-[6px] tracking-wide text-white px-2 py-0.5 rounded font-black whitespace-nowrap opacity-0 hover:opacity-100 group-hover:opacity-100 border border-white/10 shadow-lg flex items-center gap-1.5 pointer-events-auto">
                                                        <span>✍️ DRAG TO REPOSITION</span>
                                                        <button
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                updateLayoutValue('hide_text', true);
                                                            }}
                                                            onTouchStart={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                updateLayoutValue('hide_text', true);
                                                            }}
                                                            className="hover:text-red-400 text-red-500 font-extrabold px-1.5 bg-white/15 rounded transition-all cursor-pointer font-sans select-none ml-1 uppercase"
                                                            title="Delete/Hide Text Box"
                                                        >
                                                            DELETE
                                                        </button>
                                                    </div>
                                                </div>
                                            )) }

                                            {/* CTA Custom placed buttons */}
                                            {(bannerForm.button_link_context?.buttons || []).map((btn: any) => {
                                                const coords = getLayoutButtonCoordinates(btn.id, btn.x ?? 50, btn.y ?? 75, btn.scale);
                                                return (
                                                    <div
                                                        key={btn.id}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setDraggingButtonId(btn.id);
                                                        }}
                                                        onTouchStart={(e) => {
                                                            e.stopPropagation();
                                                            setDraggingButtonId(btn.id);
                                                        }}
                                                        className={`absolute cursor-grab active:cursor-grabbing z-30 select-none pb-1.5 ${isDrawingMode ? 'pointer-events-none opacity-40' : ''} ${draggingButtonId === btn.id ? 'scale-105 ring-2 ring-[#C9A236]' : ''}`}
                                                        style={{
                                                            left: `${coords.x}%`,
                                                            top: `${coords.y}%`,
                                                            transform: `translate(-50%, -50%) scale(${(coords.scale) / 100})`
                                                        }}
                                                    >
                                                        <div 
                                                            className={`font-black uppercase text-[8px] tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none flex items-center justify-center text-center overflow-hidden transition-all duration-200 ${btn.is_hotspot ? 'border-2 border-dashed border-[#C9A236]' : ''}`}
                                                            style={{
                                                                width: coords.width && coords.width > 0 ? `${coords.width}px` : 'auto',
                                                                height: coords.height && coords.height > 0 ? `${coords.height}px` : (btn.is_hotspot ? '44px' : 'auto'),
                                                                backgroundColor: btn.is_hotspot ? 'rgba(201, 162, 54, 0.25)' : (btn.bg_color || '#C9A236'),
                                                                color: btn.is_hotspot ? '#C9A236' : (btn.text_color || '#0F4A3C'),
                                                                borderColor: btn.is_hotspot ? '#C9A236' : (btn.border_color || 'transparent'),
                                                                borderWidth: btn.is_hotspot ? '2px' : (btn.border_color ? '2px' : '0px'),
                                                                borderRadius: btn.is_hotspot ? '4px' : (
                                                                              btn.border_radius === 'sharp' ? '0px' :
                                                                              btn.border_radius === 'rounded-sm' ? '4px' :
                                                                              btn.border_radius === 'rounded font-black' ? '8px' :
                                                                              btn.border_radius === 'rounded-xl' ? '14px' : '9999px'
                                                                )
                                                            }}
                                                        >
                                                            <div className="px-3 py-1.5 flex items-center justify-center gap-1 truncate w-full h-full text-center">
                                                                <span>{btn.is_hotspot ? `🔲 Hotspot: ${btn.text}` : `🎯 ${btn.text}`}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Connected Product Preview Overlay badge */}
                                            {bannerForm.button_link_context?.product_id && bannerForm.button_link_context?.show_product_badge && (() => {
                                                const pId = bannerForm.button_link_context.product_id;
                                                const p = products.find(prod => prod.id === pId);
                                                if (!p) return null;
                                                return (
                                                    <div className={`absolute z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-hav-gold/25 p-3 shadow-2xl text-gray-900 flex items-center gap-2 select-none animate-fade-in ${
                                                        fullscreenDevice === 'mobile' ? 'bottom-2 right-2 max-w-[150px]' : 'bottom-6 right-6 max-w-[200px]'
                                                    }`}>
                                                        <img 
                                                            src={p.image_urls?.[0]} 
                                                            alt={p.name} 
                                                            className={`${fullscreenDevice === 'mobile' ? 'w-7 h-7' : 'w-10 h-10'} object-cover rounded-lg border border-gray-100 shrink-0`} 
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        <div className="flex-1 text-left min-w-0">
                                                            <h4 className={`font-serif font-black text-hav-forest truncate leading-tight ${fullscreenDevice === 'mobile' ? 'text-[7px]' : 'text-[9px]'}`}>
                                                                {p.name}
                                                            </h4>
                                                            <div className="flex items-center justify-between gap-1 mt-0.5">
                                                                <span className={`font-black text-hav-forest ${fullscreenDevice === 'mobile' ? 'text-[8px]' : 'text-[9px]'}`}>
                                                                    ₹{p.product_variants?.[0]?.price || 350}
                                                                </span>
                                                                <span className="bg-hav-gold/15 text-hav-forest font-black text-[6px] px-1 py-0.5 rounded uppercase font-sans">
                                                                    Linked
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Rulers / instructions bar onbottom */}
                        <div className="w-full text-center text-xs text-gray-400 mt-auto pt-4 border-t border-[#DFCFAF]/10 flex justify-between items-center bg-[#07211B] p-4 rounded-xl z-10 font-mono">
                            <span>🎮 Drag interactive pins left & right/up & down to synchronize layout coordinates in real-time.</span>
                            <span className="font-bold text-[#C9A236]">Current viewport: {fullscreenDevice.toUpperCase()} layout</span>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
